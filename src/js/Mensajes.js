'use strict';
import toastr from 'toastr'
toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-bottom-right",
    "preventDuplicates": true,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "2000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "slideDown",
    "hideMethod": "fadeOut"
}

export class Mensajes {
    constructor() {
        this.msg = "<span style=\"color: black!important;font-size:100%;font-family:'Courier New',monospace \">mensaje</span>"
        this.crearTypes()

    }
    crearTypes() {
        this["info"] = (mensaje) => {
            this.crearMensaje("info", mensaje)
        }
        this["success"] = (mensaje) => {
            this.crearMensaje("success", mensaje)
        }
        this["warning"] =  (type) => {
            let mensaje;
            switch (type){
                case 'BLOQUES_8':
                    mensaje =  "8 Bloques";
                    break;
                case 'BLOQUES_7':
                    mensaje =  "7 Bloques";
                    break;
                case "BLOQUES_6":
                    mensaje =  "6 Bloques";
                    break;
                case "BLOQUES_5":
                    mensaje =  "5 Bloques";
                    break;
                case "BLOQUES_4":
                    mensaje =  "4 Bloques";
                    break;
            }
            this.crearMensaje("warning", mensaje)
        }
    }

    crearMensaje(type, mensaje) {
        toastr[type](this.msg.replace("mensaje", mensaje))
    }

}

