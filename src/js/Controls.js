'use strict';

// Abstraction over common controls for user interaction with a 3D scene
import {vec3} from "gl-matrix";
import {Bloque} from "./Bloque";
import {dimensiones} from "./dimensiones";


export class Controls {

    constructor(camera, canvas, droneCam, spotLightDir, bloque, msg) {
        this.bloque = bloque;
        this.camera = camera;
        this.canvas = canvas;
        this.droneCam = droneCam;
        this.spotLightDir = spotLightDir;
        this.picker = null;
        this.msg = msg;

        this.dragging = false;
        this.picking = false;
        this.ctrl = false;

        this.x = 0;
        this.y = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.button = 0;
        this.key = 0;

        this.dloc = 0;
        this.dstep = 0;
        this.motionFactor = 10;
        this.keyIncrement = 2;
        this.spotLightTypeOptions = 0;
        this.bloqueTypeOptions = Bloque.TYPES.length - 1;

        this.controlesCapsula = false;

        this.focusCamera = {
            Nave: false,
            PanelesSolares: false,
            Capsula: false,
            Luna: false,
            Tierra: false
        }
        canvas.onmousedown = event => this.onMouseDown(event);
        canvas.onmouseup = event => this.onMouseUp(event);
        canvas.onmousemove = event => this.onMouseMove(event);
        canvas.onwheel = event => this.onMouseWheel(event);
        window.onkeydown = event => this.onKeyDown(event);
        window.onkeyup = event => this.onKeyUp(event);

        this.dondeEstoy = "Nave" //el programa arranca en la camara de la nave
        //no inicializo la pos en la nave, ya que comienzo en esta camara
        this.Camara = {
            Nave: {
                position: vec3.create(),
                azimuth: 0,
                elevation: 0,
                focus: vec3.create()
            },
            PanelesSolares: {
                //el programa arranca con la camara en (0,0,40) y el foco en (0,0,0), la cam de paneles tiene el foco en
                //(0,0,10.15) asi que la distancia entre el foco y la camara de panel es de 10.15, por eso podria arrancar en
                // (0,0,40-10.15)/az=0, el=0, para que las dos camaras de Nave y paneles tengan la misma distancia relativa con lo que se mira
                //OJO-> las posiciones son estaticas, la nave no se mueve, ni los paneles. (es decir el foco siempre es el mismo)

                //seteo una posicion particular de inicio para la camara de paneles
                position: vec3.fromValues(0, 0, 29.5),
                azimuth: -180,
                elevation: -30,
                focus: vec3.create()
            },
            Capsula: {
                position: vec3.fromValues(0, 0, 20),
                azimuth: 0.00,
                elevation: -30.8,
                focus: vec3.create()
            },
            Luna: { //estos valores son reemplazados inmediatamente de acuerdo al random
                position: vec3.fromValues(0, 0, 20),
                azimuth: 0.00,
                elevation: -30.8,
                focus: vec3.create()
            },
            Tierra: {
                position: vec3.fromValues(0, 0, 20),
                azimuth: 0.00,
                elevation: -30.8,
                focus: vec3.create()
            },
        }

    }

    setParamCamara(random) { //tambien lo puedo hacer para los paneles solares, la capsula y la nave
        const lunaInitParam = dimensiones.lunaCamaraInitValues[random];
        this.Camara.Luna = Object.assign({}, lunaInitParam);

        const tierraInitParam = dimensiones.tierraCamaraInitValues[random];
        this.Camara.Tierra = Object.assign({}, tierraInitParam);

        const panelesSolaresInitParam = dimensiones.panelesSolaresCamaraInitValues[random];
        this.Camara.PanelesSolares = Object.assign({}, panelesSolaresInitParam);

        const capsulaInitParam = dimensiones.capsulaCamaraInitValues[random];
        this.Camara.Capsula = Object.assign({}, capsulaInitParam);

    }

    setFocusCapsula(focusCapsula) {
        this.Camara.Capsula.focus = focusCapsula

    }

    setFocus(focusNave, focusPanelesSolares) {
        this.Camara.Nave.focus = focusNave  //el focus de la nave por ahora es el origen
        this.Camara.PanelesSolares.focus = focusPanelesSolares  //dimensionesTuboPrincipal.altura, el focus de los paneles solares
    }

    setFocusLuna(focusLuna) {
        this.Camara.Luna.focus = focusLuna
    }

    setFocusTierra(focusTierra) {
        this.Camara.Tierra.focus = focusTierra
    }

    // Sets picker for picking objects
    setPicker(picker) {
        this.picker = picker;
    }

    // Returns 3D coordinates
    get2DCoords(event) {
        let top = 0,
            left = 0,
            canvas = this.canvas;

        while (canvas && canvas.tagName !== 'BODY') {
            top += canvas.offsetTop;
            left += canvas.offsetLeft;
            canvas = canvas.offsetParent;
        }

        left += window.pageXOffset;
        top -= window.pageYOffset;

        return {
            x: event.clientX - left,
            y: this.canvas.height - (event.clientY - top)
        };
    }

    onMouseUp(event) {
        this.dragging = false;

        if (!event.shiftKey && this.picker) {
            this.picking = false;
            this.picker.stop();
        }
        this.droneCam.updateWithMouseReset()
    }


    onMouseDown(event) {
        this.dragging = true;

        this.x = event.clientX;
        this.y = event.clientY;
        this.button = event.button;

        this.dstep = Math.max(this.camera.position[0], this.camera.position[1], this.camera.position[2]) / 100;

        if (!this.picker) return;

        const coordinates = this.get2DCoords(event);
        this.picking = this.picker.find(coordinates);

        if (!this.picking) this.picker.stop();

    }

    dollyHelper(delta, rapidez = 3) {

        this.dstep = Math.max(this.camera.position[0], this.camera.position[1], this.camera.position[2]) / 100;
        while (rapidez--)
            this.dolly(delta)

    }

    onMouseWheel(event) {
        const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
        this.shift = event.shiftKey;

        (this.shift && this.controlesCapsula)?
            this.cambiarAnguloDeAperturaSpotLight(delta):
            this.dollyHelper(delta);
    }
    cambiarAnguloDeAperturaSpotLight(delta) {
        this.spotLightDir.cambiarAnguloDeApertura(delta);
    }

    onMouseMove(event) {
        this.lastX = this.x;
        this.lastY = this.y;

        this.x = event.clientX;
        this.y = event.clientY;

        if (!this.dragging) return;

        this.ctrl = event.ctrlKey;
        this.alt = event.altKey;
        this.shift = event.shiftKey;

        const dx = this.x - this.lastX;
        const dy = this.y - this.lastY;

        if (this.picking && this.picker.moveCallback) {
            this.picker.moveCallback(dx, dy);
            return;
        }
        if (!this.button) { //left click
            (this.shift && this.controlesCapsula)
                ? this.rotarCapsula(dx, dy)//this.dolly(dy)
                : this.rotate(dx, dy);
        }
        if (this.button === 1 && this.controlesCapsula) { //middle button
            this.spotLight(dx, dy);
        }

    }

    rotarCapsula(dx, dy) {
        const {width, height} = this.canvas;

        const deltaX = 2 / width;
        const deltaY = -2 / height;

        const DX = dx * deltaX;
        const DY = dy * deltaY;

        this.droneCam.updateWithMouse(DY, DX);
    }

    spotLight(dx, dy) {
        const {width, height} = this.canvas;

        const deltaAzimuth = 20 / width;
        const deltaElevation = -20 / height;

        const azimuth = dx * deltaAzimuth * this.motionFactor;
        const elevation = dy * deltaElevation * this.motionFactor;

        this.spotLightDir.cambiarAzimuth(azimuth);
        this.spotLightDir.cambiarElevation(elevation);
    }

    configurarCamaraDe(objetivo) {

        vec3.copy(this.Camara[this.dondeEstoy].position, this.camera.position)
        this.Camara[this.dondeEstoy].azimuth = this.camera.azimuth
        this.Camara[this.dondeEstoy].elevation = this.camera.elevation

        this.camera.goTo(
            this.Camara[objetivo].position,
            this.Camara[objetivo].azimuth,
            this.Camara[objetivo].elevation,
            this.Camara[objetivo].focus
        )
        this.dondeEstoy = objetivo;

        if (objetivo === "Nave") {
            this.focusCamera.PanelesSolares = false;
            this.focusCamera.Capsula = false;
            this.focusCamera.Luna = false;
            this.focusCamera.Tierra = false;
            this.focusCamera.Nave = true;
        } else if (objetivo === "PanelesSolares") {
            this.focusCamera.Nave = false;
            this.focusCamera.Capsula = false;
            this.focusCamera.Luna = false;
            this.focusCamera.Tierra = false;
            this.focusCamera.PanelesSolares = true;
        } else if (objetivo === "Capsula") {
            this.focusCamera.Nave = false;
            this.focusCamera.PanelesSolares = false;
            this.focusCamera.Luna = false;
            this.focusCamera.Tierra = false;
            this.focusCamera.Capsula = true;
        } else if (objetivo === "Luna") {
            this.focusCamera.Nave = false;
            this.focusCamera.PanelesSolares = false;
            this.focusCamera.Luna = true;
            this.focusCamera.Tierra = false;
            this.focusCamera.Capsula = false;
        } else if (objetivo === "Tierra") {
            this.focusCamera.Nave = false;
            this.focusCamera.PanelesSolares = false;
            this.focusCamera.Luna = false;
            this.focusCamera.Tierra = true;
            this.focusCamera.Capsula = false;
        }
    }

    onKeyDown(event) {
        this.key = event.keyCode;
        this.ctrl = event.ctrlKey;

        if (this.ctrl) return;
        switch (this.key) {
            /*
            case 37:
              return this.camera.changeAzimuth(-this.keyIncrement);
            case 38:
              return this.camera.changeElevation(this.keyIncrement);
            case 39:
              return this.camera.changeAzimuth(this.keyIncrement);
            case 40:
              return this.camera.changeElevation(-this.keyIncrement);

             */
            case 49:
                this.controlesCapsula = false;
                this.droneCam.activarControlesTeclado(false);
                this.camera.borrarTimeOutIdPool(); //cualquier llamdo vigente que quede cuando la camara de la capsula se mueva se borra
                this.camera.dejarDeSeguirALaCapsula();
                this.msg["info"]("Estación Espacial");
                return this.configurarCamaraDe("Nave");
            case 50:
                this.controlesCapsula = false;
                this.droneCam.activarControlesTeclado(false);
                this.camera.borrarTimeOutIdPool();
                this.camera.dejarDeSeguirALaCapsula();
                this.msg["info"]("Paneles Solares");
                return this.configurarCamaraDe("PanelesSolares");
            case 51:
                this.controlesCapsula = true;
                this.droneCam.activarControlesTeclado();
                this.camera.seguirALaCapsula() //activa la matrix de rotacion que se calcula con los controles de la capsula
                this.msg["info"]("Capsula");
                return this.configurarCamaraDe("Capsula");
            case 52:
                this.controlesCapsula = false;
                this.droneCam.activarControlesTeclado(false);
                this.camera.borrarTimeOutIdPool();
                this.camera.dejarDeSeguirALaCapsula();
                this.msg["info"]("Luna");
                return this.configurarCamaraDe("Luna");
            case 53:
                this.controlesCapsula = false;
                this.droneCam.activarControlesTeclado(false);
                this.camera.borrarTimeOutIdPool();
                this.camera.dejarDeSeguirALaCapsula();
                this.msg["info"]("Tierra");
                return this.configurarCamaraDe("Tierra");
            case 88: //z zoom out
                return this.dollyHelper(-1);
            case 90: //x zoom in
                return this.dollyHelper(1);


            case 70: //f
                if (!this.controlesCapsula)
                    return;
                this.spotLightTypeOptions++;
                switch (this.spotLightTypeOptions) {
                    case 1:
                        this.spotLightDir.activarLuces();
                        this.spotLightDir.lucesBlancas();
                        this.msg["success"]("Luces Blancas");
                        break;
                    case 2:
                        this.spotLightDir.apagarLuces();
                        this.msg["success"]("Luces Apagadas");
                        break;
                    default:
                        this.spotLightDir.activarLuces();
                        this.spotLightDir.lucesRG();
                        this.msg["success"]("Luces Rojas y Verdes");
                        this.spotLightTypeOptions = 0; //reset
                        break;
                }
                return;
            case 66: //b
                this.bloqueTypeOptions--;
                if (this.bloqueTypeOptions < 0)
                    this.bloqueTypeOptions = Bloque.TYPES.length - 1;
                const type = Bloque.TYPES[this.bloqueTypeOptions]
                this.msg["warning"](type);
                this.bloque.setType(type);
                return;
        }
    }

    onKeyUp(event) {
        if (event.keyCode === 17) {
            this.ctrl = false;
        }
    }

    dolly(value) {
        if (value > 0) {
            this.dloc += this.dstep;
        } else {
            this.dloc -= this.dstep;
        }
        this.camera.dolly(this.dloc);
    }

    rotate(dx, dy) {
        const {width, height} = this.canvas;

        const deltaAzimuth = -20 / width;
        const deltaElevation = -20 / height;

        const azimuth = dx * deltaAzimuth * this.motionFactor;
        const elevation = dy * deltaElevation * this.motionFactor;

        this.camera.changeAzimuth(azimuth);
        this.camera.changeElevation(elevation);
    }

}