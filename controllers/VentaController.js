let Venta = require('../models/venta')
let Dventa = require('../models/dventa')
let Producto = require('../models/producto')
let Carrito = require('../models/carrito')

let fs=require('fs')
let handlebars = require('handlebars');
let ejs = require('ejs');
let nodemailer = require('nodemailer');
let smtpTransport = require('nodemailer-smtp-transport');
let path = require('path');

const registro_compra_cliente = async function (req, res) {
    if (req.user) {

        var data = req.body;
        var detalles = data.detalles;

        var venta_last = await Venta.find().sort({createdAt: -1})
        var serie;
        var correlativo;
        var n_venta;

        if(venta_last.length ==0){
            serie='001';
            correlativo='000001';

            n_venta= serie + '-' + correlativo
        }else{
             var last_nventa = venta_last[0].nventa;
             var arr_nventa = last_nventa.split('-')
             if(arr_nventa[1] != '999999'){
                
             var new_correlativo = zfill(parseInt(arr_nventa[1])+1,6)
             n_venta= arr_nventa[0] + '-'+ new_correlativo
             
             }else if(arr_nventa[1] == '999999'){
                var new_serie = zfill(parseInt(arr_nventa[0])+1,3)
                n_venta= new_serie + '-000001'
             }
        }
        data.nventa = n_venta
        data.estado = 'Procesando';

         let venta = await Venta.create(data);

         detalles.forEach(async element => {
            element.venta = venta._id;
            await Dventa.create(element)

            let element_producto = await Producto.findById({_id:element.producto});
            let new_stock= element_producto.stock - element.cantidad;

            await Producto.findByIdAndUpdate({_id: element.producto},{
                stock: new_stock
            })

            // limpiar Carrito
            await Carrito.deleteMany({cliente:data.cliente})
         });
        res.status(200).send({venta:venta});
    } else {
        res.status(500).send({ message: 'NoAccess' });
    }
}

function zfill(number, width) {
    var numberOutput = Math.abs(number); 
    var length = number.toString().length;
    var zero = "0";
    
    if (width <= length) {
        if (number < 0) {
             return ("-" + numberOutput.toString()); 
        } else {
             return numberOutput.toString(); 
        }
    } else {
        if (number < 0) {
            return ("-" + (zero.repeat(width - length)) + numberOutput.toString()); 
        } else {
            return ((zero.repeat(width - length)) + numberOutput.toString()); 
        }

    }
}
const enviar_correo_compra_cliente= async function(req,res){

    let id=req.params['id'];
    let readHTMLFile = function(path, callback) {
        fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
            if (err) {
                throw err;
                callback(err);
            }
            else {
                callback(null, html);
            }
        });
    };

    let transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
        user: 'ferrelomas40@gmail.com',
        pass: 'zdrbzdyiakgsckld'
        }
    }));
    
    let venta = await Venta.findById({_id: id}).populate('cliente');
    let detalles = await Dventa.find({venta:id}).populate('producto');
 
    
    let cliente = venta.cliente.nombres + ' '+ venta.cliente.apellidos;
    let _id = venta._id;
    let fecha = new Date(venta.createdAt);
    let data = detalles;
    let subtotal = venta.subtotal;
    let titulo_envio = venta.envio_titulo;
    let precio_envio = venta.envio_precio;
    readHTMLFile(process.cwd() + '/mail.html', (err, html)=>{
                            
        let rest_html = ejs.render(html, {data: data, cliente:cliente, _id:_id, fecha:fecha, subtotal:subtotal, titulo_envio: titulo_envio, precio_envio: precio_envio});
    
        let template = handlebars.compile(rest_html);
        let htmlToSend = template({op:true});
    
        let mailOptions = {
            from: 'ferrelomas40@gmail.com',
            to: venta.cliente.email,
            subject: 'Gracias por tu compra, FerreLomas',
            html: htmlToSend
        };
        res.status(200).send({data:true});
        transporter.sendMail(mailOptions, function(error, info){
            if (!error) {
                console.log('Email sent: ' + info.response);
            }
        });
      
    });
    
    }
    
module.exports = {
    registro_compra_cliente,
    enviar_correo_compra_cliente
}

