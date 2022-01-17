'use strict';
import toastr from 'toastr'
toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-bottom-right",
    "preventDuplicates": false,
    "preventOpenDuplicates": true,
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
        this.msg = "<span style=\"color: black!important;font-size:100%;font-family:'Courier New',monospace \"><b>mensaje</b></span>"
        this.menuControlesTitulo = "<span style=\"color: black!important;font-size:100%;font-family:'Courier New',monospace \"><b>mensaje</b></span></br>"
        this.menuControlesDescripcion = "<span style=\"color: gold!important;font-size:100%;font-family:'Courier New',monospace \">mensaje</span></br>"
        this.crearTypes()

    }
    clear() {
        toastr.clear()
    }
    crearTypes() {
        this["info"] = (mensaje) => {
            this.crearMensaje("info", mensaje)
        }
        this["success"] = (mensaje) => {
            this.crearMensaje("success", mensaje)
        }
        this["warning"] = (type) => {
            let mensaje;
            switch (type) {
                case 'BLOQUES_8':
                    mensaje = "8 Bloques";
                    break;
                case 'BLOQUES_7':
                    mensaje = "7 Bloques";
                    break;
                case "BLOQUES_6":
                    mensaje = "6 Bloques";
                    break;
                case "BLOQUES_5":
                    mensaje = "5 Bloques";
                    break;
                case "BLOQUES_4":
                    mensaje = "4 Bloques";
                    break;
            }
            this.crearMensaje("warning", mensaje)
        }
        this["error"] = (mensaje, titulo = '', propiedades = {}) => {
            this.crearMensaje("error", mensaje, titulo, propiedades)
        }
    }

    crearMensaje(type, mensaje, titulo= '', propiedades = {}) {
        toastr[type](this.msg.replace("mensaje", mensaje), titulo, propiedades)
    }
    menuControlesGral(){
        toastr["error"](
            this.menuControlesTitulo.replace("mensaje", "Cámara:") +
            this.menuControlesDescripcion.replace("mensaje", "--->clickIzq + mouse") +
            this.menuControlesTitulo.replace("mensaje", "Zoom in/out:") +
            this.menuControlesDescripcion.replace("mensaje", "--->mouseWheel") +
            this.menuControlesDescripcion.replace("mensaje", "--->z/x") +

            this.menuControlesTitulo.replace("mensaje", "Cantidad de Bloques:") +
            this.menuControlesDescripcion.replace("mensaje", "--->B") +
            this.menuControlesTitulo.replace("mensaje", "Estación Espacial:") +
            this.menuControlesDescripcion.replace("mensaje", "--->1") +
            this.menuControlesTitulo.replace("mensaje", "Paneles Solares:") +
            this.menuControlesDescripcion.replace("mensaje", "--->2") +
            this.menuControlesTitulo.replace("mensaje", "Cápsula:") +
            this.menuControlesDescripcion.replace("mensaje", "--->3") +
            this.menuControlesTitulo.replace("mensaje", "Satélite Luna:") +
            this.menuControlesDescripcion.replace("mensaje", "--->4") +
            this.menuControlesTitulo.replace("mensaje", "Planeta Tierra:") +
            this.menuControlesDescripcion.replace("mensaje", "--->5") +
            this.menuControlesTitulo.replace("mensaje", "Controles") +
            this.menuControlesDescripcion.replace("mensaje", "--->H")
            , '', {
                "closeButton": true,
                "timeOut": 20000,
                "extendedTimeOut": 1000,
                "preventDuplicates": true,
                "progressBar": true,
            })

    }
    menuControlesCapsula() {
        toastr["error"](
            this.menuControlesTitulo.replace("mensaje", "Desplazamiento: &larr;&uarr;&darr;&rarr;") +
            this.menuControlesDescripcion.replace("mensaje", "--->AWSDQE") +
            this.menuControlesDescripcion.replace("mensaje", "--->spaceBar") +
            this.menuControlesTitulo.replace("mensaje", "Giro:") +
            this.menuControlesDescripcion.replace("mensaje", "--->JKLOIU") +
            this.menuControlesDescripcion.replace("mensaje", "--->shift + clickIzq + &nbsp;&nbsp;&nbsp;&nbsp;mouse") +
            this.menuControlesTitulo.replace("mensaje", "Faros dirección:") +
            this.menuControlesDescripcion.replace("mensaje", "--->middleClick + mouse") +
            this.menuControlesDescripcion.replace("mensaje", "--->NumPad Keys") +
            this.menuControlesTitulo.replace("mensaje", "Faros ángulo:") +
            this.menuControlesDescripcion.replace("mensaje", "--->shift + mouseWheel") +
            this.menuControlesTitulo.replace("mensaje", "Faros centrar:") +
            this.menuControlesDescripcion.replace("mensaje", "--->C, NumPad5") +
            this.menuControlesTitulo.replace("mensaje", "Faros turnar tipo:") +
            this.menuControlesDescripcion.replace("mensaje", "--->F") +
            this.menuControlesTitulo.replace("mensaje", "Controles Cápsula") +
            this.menuControlesDescripcion.replace("mensaje", "--->H")


            , '', {
                "closeButton": true,
                "timeOut": 90000,
                "extendedTimeOut": 1000,
                "preventDuplicates": true,
                "progressBar": true,
            })
    }

}