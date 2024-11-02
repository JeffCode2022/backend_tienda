'use strict';

// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');

// Rutas
const clienteRoute = require('./routes/cliente');
const adminRoute = require('./routes/admin');
const productoRoute = require('./routes/producto');
const cuponRoute = require('./routes/cupon');
const configRoute = require('./routes/config');
const carritoRoute = require('./routes/carrito');
const ventaRoute = require('./routes/venta');
const descuentoRoute = require('./routes/descuento');

const app = express();
const port = process.env.PORT || 4201;
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb', extended: true }));

// Configuración de CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Access-Control-Allow-Methods');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  const events = [
    { event: 'delete-carrito', response: 'new-carrito' },
    { event: 'add-carrito-add', response: 'new-carrito-add' },
    { event: 'add-producto-admin', response: 'new-producto-admin' },
    { event: 'delete-producto-admin', response: 'new-delete-admin' },
    { event: 'edit-descuento-admin', response: 'new-descuento-admin' },
    { event: 'create-descuento-admin', response: 'new-descuento-admin' },
    { event: 'delete-descuento-admin', response: 'new-descuento-admin' },
    { event: 'create-contacto-tienda', response: 'new-contacto-admin' },
  ];

  events.forEach(({ event, response }) => {
    socket.on(event, (data) => {
      try {
        io.emit(response, data);
      } catch (error) {
        console.error(`Error en el evento ${event}:`, error);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Conexión a MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conexión a MongoDB Atlas exitosa');
  } catch (error) {
    console.error('Error en la conexión a MongoDB Atlas:', error);
    process.exit(1); // Termina el proceso si la conexión falla
  }
};

// Definición de rutas
app.use('/api', clienteRoute);
app.use('/api', adminRoute);
app.use('/api', productoRoute);
app.use('/api', cuponRoute);
app.use('/api', configRoute);
app.use('/api', carritoRoute);
app.use('/api', ventaRoute);
app.use('/api', descuentoRoute);

// Iniciar el servidor
const startServer = async () => {
  await connectDB();
  server.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
};

startServer();

module.exports = app;
