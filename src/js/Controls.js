'use strict';

// Abstraction over common controls for user interaction with a 3D scene
import {vec3} from "gl-matrix";

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
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}



export class Controls {

  constructor(camera, canvas, droneCam, spotLightDir) {
    this.camera = camera;
    this.canvas = canvas;
    this.droneCam = droneCam;
    this.spotLightDir = spotLightDir;
    this.picker = null;

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
    this.keyIncrement = 3;

    this.focusCamera = {
      Nave: false,
      PanelesSolares: false,
      Capsula: false,
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
      Nave : {
        position : vec3.create(),
        azimuth : 0,
        elevation : 0,
        focus : vec3.create()
      },
      PanelesSolares : {
        //el programa arranca con la camara en (0,0,40) y el foco en (0,0,0), la cam de paneles tiene el foco en
        //(0,0,10.15) asi que la distancia entre el foco y la camara de panel es de 10.15, por eso podria arrancar en
        // (0,0,40-10.15)/az=0, el=0, para que las dos camaras de Nave y paneles tengan la misma distancia relativa con lo que se mira
        //OJO-> las posiciones son estaticas, la nave no se mueve, ni los paneles. (es decir el foco siempre es el mismo)

        //seteo una posicion particular de inicio para la camara de paneles
        position : vec3.fromValues(0, 0,  29.5),
        azimuth : -180,
        elevation : -30,
        focus : vec3.create()
      },
      Capsula : {
        position : vec3.fromValues(0, 0,  20),
        azimuth : 0.00,
        elevation : -30.8,
        focus : vec3.create()
      },
    }

  }
  setFocusCapsula(focusCapsula) {
    this.Camara.Capsula.focus = focusCapsula

  }

  setFocus(focusNave, focusPanelesSolares){
    this.Camara.Nave.focus = focusNave  //el focus de la nave por ahora es el origen
    this.Camara.PanelesSolares.focus = focusPanelesSolares  //dimensionesTuboPrincipal.altura, el focus de los paneles solares

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

  dollyHelper(delta, rapidez = 3){

    this.dstep = Math.max(this.camera.position[0], this.camera.position[1], this.camera.position[2]) / 100;
    while(rapidez--)
      this.dolly(delta)

  }
  onMouseWheel(event) {
    const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
    this.dollyHelper(delta)
  }

  onMouseMove(event) {
    this.lastX = this.x;
    this.lastY = this.y;

    this.x = event.clientX;
    this.y = event.clientY;

    if (!this.dragging) return;

    this.ctrl = event.ctrlKey;
    this.alt = event.altKey;

    const dx = this.x - this.lastX;
    const dy = this.y - this.lastY;

    if (this.picking && this.picker.moveCallback) {
      this.picker.moveCallback(dx, dy);
      return;
    }
    if (!this.button) {
      this.alt
        ? this.dolly(dy)
        : this.rotate(dx, dy);
    }
  }

  configurarCamaraDe(objetivo){

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

    if(objetivo === "Nave"){
      this.focusCamera.PanelesSolares = false;
      this.focusCamera.Capsula = false;
      this.focusCamera.Nave = true;
    }else if(objetivo === "PanelesSolares") {
      this.focusCamera.Nave = false;
      this.focusCamera.Capsula = false;
      this.focusCamera.PanelesSolares = true;
    }else if(objetivo === "Capsula") {
      this.focusCamera.Nave = false;
      this.focusCamera.PanelesSolares = false;
      this.focusCamera.Capsula = true;
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
        this.droneCam.activarControlesTeclado(false);
        this.camera.borrarTimeOutIdPool(); //cualquier llamdo vigente que quede cuando la camara de la capsula se mueva se borra
        this.camera.dejarDeSeguirALaCapsula();
        toastr["info"]("Camara: Estación Espacial")

        return this.configurarCamaraDe("Nave");
      case 50:
        this.droneCam.activarControlesTeclado(false);
        this.camera.borrarTimeOutIdPool();
        this.camera.dejarDeSeguirALaCapsula();
        toastr["info"]("Camara: Paneles Solares")

        return this.configurarCamaraDe("PanelesSolares");
      case 51:
        this.droneCam.activarControlesTeclado();
        this.camera.seguirALaCapsula() //activa la matrix de rotacion que se calcula con los controles de la capsula
        toastr["info"]("<span style=\"color: black!important;font-size:100%;font-family:'Courier New',monospace \">Camara: cápsula</span>")
/*
        -webkit-text-size-adjust: 100%;
        line-height: 1.5;
        color: #000!important;
        border-collapse: collapse;
        border-spacing: 0;
        text-align: left;
        box-sizing: inherit;
        font-size: 150%;
        font-family: 'Lucida Console',monospace;

 */





        return this.configurarCamaraDe("Capsula");
      case 88: //z zoom out
        return this.dollyHelper(-1);
      case 90: //x zoom in
        return this.dollyHelper(1);
      case 102:
        return this.spotLightDir.cambiarAzimuth(this.keyIncrement);
      case 100:
        return this.spotLightDir.cambiarAzimuth(-this.keyIncrement);
      case 104:
        return this.spotLightDir.cambiarElevation(this.keyIncrement);
      case 98:
        return this.spotLightDir.cambiarEleCopperplatevation(-this.keyIncrement);



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
    }
    else {
      this.dloc -= this.dstep;
    }
    this.camera.dolly(this.dloc);
  }

  rotate(dx, dy) {
    const { width, height } = this.canvas;

    const deltaAzimuth = -20 / width;
    const deltaElevation = -20 / height;

    const azimuth = dx * deltaAzimuth * this.motionFactor;
    const elevation = dy * deltaElevation * this.motionFactor;

    this.camera.changeAzimuth(azimuth);
    this.camera.changeElevation(elevation);
  }

}