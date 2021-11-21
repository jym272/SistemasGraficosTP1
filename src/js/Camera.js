'use strict';
import {mat4, vec3, vec4} from "gl-matrix";
// Abstraction over constructing and interacting with a 3D scene using a camera
export class Camera {

  constructor(type = Camera.ORBITING_TYPE) {
    this.position = vec3.create();
    this.focus = vec3.create();
   // this.home = vec3.create();

    this.up = vec3.create();
    this.right = vec3.create();
    this.normal = vec3.create();

    this.matrix = mat4.create();

    //Caracteristicas de la camara
    this.steps = 0;
    this.azimuth = 0;
    this.elevation = 0;
    this.fov = 45;
    this.minZ = 0.1;
    this.maxZ = 10000;
    /*
     * Auxilares para la camara de la capsula
     */
    this.factorVelocidad = 500; //con la cual la camara regresa a su posicion por default
    //el inicio de la camara de la capsula por default
    this.azimuthActual = 0;
    this.elevationActual = -30
    this.timeOutIdPool = [];

    //Matrix de rotacion que rota a la camara según la rotación de la capsula
    this.rotationMatrix = null;

    this.setType(type);
  }
  //Se usa el mismo objeto tanto en la transformacion de la geoemtria de la capsula, como en la de la camara
  setRotationMatrix(matrix){
    this.rotationMatrix = matrix;
  }

  // Return whether the camera is in orbiting mode
  isOrbiting() {
    return this.type === Camera.ORBITING_TYPE;
  }

  // Return whether the camera is in tracking mode
  isTracking() {
    return this.type === Camera.TRACKING_TYPE;
  }

  // Change camera type
  setType(type) {
    ~Camera.TYPES.indexOf(type)
      ? this.type = type
      : console.error(`Camera type (${type}) not supported`);
  }

  goTo(position = [0,0,0], azimuth = 0, elevation = 0, focus = [0,0,0]) {
    this.setPosition(position);
    this.setAzimuth(azimuth);
    this.setElevation(elevation);
    this.setFocus(focus);
  }

  /*  Deprecated
  // Position the camera back home
  goHome(home, focus=[0,0,0]) { //focus is optional, sino es el origen
    if (home) { //si enviaron un home
      this.home = home; //lo seteo
    }

    this.setPosition(this.home);
    this.setAzimuth(0);
    this.setElevation(0);
    this.setFocus(focus);
  }

   */

  // Dolly the camera
  dolly(stepIncrement) {
    const normal = vec3.create();
    const newPosition = vec3.create();
    vec3.normalize(normal, this.normal);

    const step = stepIncrement - this.steps;

    if (this.isTracking()) {
      newPosition[0] = this.position[0] - step * normal[0];
      newPosition[1] = this.position[1] - step * normal[1];
      newPosition[2] = this.position[2] - step * normal[2];
    }
    else {
      // cool track --> probar luego
      //newPosition[0] = this.position[0] - step * this.right[0];
      //newPosition[1] = this.position[1] - step * this.right[1];
      newPosition[0] = this.position[0] ;
      newPosition[1] = this.position[1] ;
      newPosition[2] = this.position[2] - step;
    }

    this.steps = stepIncrement;
    this.setPosition(newPosition);
  }

  // Change camera position
  setPosition(position) {
    vec3.copy(this.position, position);
    this.update();
  }

  // Change camera focus
  setFocus(focus) {
    vec3.copy(this.focus, focus);
    this.update();
  }

  colocarPaulatinamenteLaCamaraEn(elevation, azimuth){

    const azimuthActual = this.azimuthActual;
    const elevationActual = this.elevationActual;

    const distanciaElevation = this.elevation - elevation;
    const diffElevation = distanciaElevation / this.factorVelocidad;

    const distanciaAzimuth = this.azimuth - azimuth;
    const diffAzimuth = distanciaAzimuth / this.factorVelocidad;

    console.log(diffAzimuth.toFixed(4), diffElevation.toFixed(4));

    if(Math.abs(diffElevation)>0.001 || Math.abs(diffAzimuth)>0.001){

      this.elevation -= diffElevation;
      this.azimuth -= diffAzimuth;
      this.update();

      if(azimuthActual === azimuth && elevationActual === elevation) {

        this.timeOutIdPool.push(setTimeout(() => {
          this.colocarPaulatinamenteLaCamaraEn(elevation, azimuth);
        }, 10));
      }else{
        //clear timeout every item in the pool
        this.borrarTimeOutIdPool();
        //me llego una nueva orden mientras estaba en el pool de la anterior
        //borro el pool de la anterior y voy por la nueva
        this.azimuthActual = azimuth;
        this.elevationActual = elevation;
        this.colocarPaulatinamenteLaCamaraEn(elevation, azimuth);
      }
    }else{
      //estoy en la direccion que deseo.
      this.borrarTimeOutIdPool();
    }
  }

  borrarTimeOutIdPool(){
    this.timeOutIdPool.forEach(id => {
      clearTimeout(id);
    });
    this.timeOutIdPool = []; //reseteo el pool
  }

  // Set camera azimuth
  setAzimuth(azimuth) {
    this.changeAzimuth(azimuth - this.azimuth);
  }

  // Change camera azimuth
  changeAzimuth(azimuth) {
    this.azimuth += azimuth;

    if (this.azimuth > 360 || this.azimuth < -360) {
      this.azimuth = this.azimuth % 360;
    }

    this.update();
  }

  // Set camera elevation
  setElevation(elevation) {
    this.changeElevation(elevation - this.elevation);
  }

  // Change camera elevation
  changeElevation(elevation) {
    this.elevation += elevation;

    if (this.elevation > 360 || this.elevation < -360) {
      this.elevation = this.elevation % 360;
    }

    this.update();
  }


  lookAt(){
    //first get the position from this.matrix
    const position = vec4.create();
    vec4.set(position, 0, 0, 0, 1);
    vec4.transformMat4(position, position, this.matrix);
    //tengo en position[0,1,2] la posicion de la camara

    //calculate position - this.focus in a new vector zAxis
    const zAxis = vec3.create();
    vec3.subtract(zAxis, position, this.focus);
    vec3.normalize(zAxis, zAxis);

    //calculate the cross product of the zAxis and the up vector
    const xAxis = vec3.create();
    vec3.cross(xAxis, this.up, zAxis);
    vec3.normalize(xAxis, xAxis);

    //calculate the cross product of the xAxis and the zAxis
    const yAxis = vec3.create();
    vec3.cross(yAxis, zAxis, xAxis);
    vec3.normalize(yAxis, yAxis);
    //set the matrix to the identity matrix
    mat4.identity(this.matrix);

    //set the matrix
    mat4.set(this.matrix,
        xAxis[0], xAxis[1], xAxis[2], 0,
        yAxis[0], yAxis[1], yAxis[2], 0,
        zAxis[0], zAxis[1], zAxis[2], 0,
        position[0], position[1], position[2], 1);



  }
  // Update the camera orientation
  calculateOrientation() {
    const right = vec4.create();
    vec4.set(right, 1, 0, 0, 0);
    vec4.transformMat4(right, right, this.matrix);
    vec3.copy(this.right, right);

    const up = vec4.create();
    vec4.set(up, 0, 1, 0, 0);
    vec4.transformMat4(up, up, this.matrix);
    vec3.copy(this.up, up);

    const normal = vec4.create();
    vec4.set(normal, 0, 0, 1, 0);
    vec4.transformMat4(normal, normal, this.matrix);
    vec3.copy(this.normal, normal);
  }

  dejarDeSeguirALaCapsula(){
    this.seguirCapsula = false;
  }
  seguirALaCapsula(){
    this.seguirCapsula = true;
  }

  // Update camera values
  update() {
    mat4.identity(this.matrix);

    if (this.isTracking()) {
      mat4.translate(this.matrix, this.matrix, this.position);
      mat4.rotateY(this.matrix, this.matrix, this.azimuth * Math.PI / 180);
      mat4.rotateX(this.matrix, this.matrix, this.elevation * Math.PI / 180);
    }
    else {
      //rotate with center focus
      mat4.translate(this.matrix, this.matrix, this.focus);
      (this.seguirCapsula)?mat4.multiply(this.matrix,this.matrix,this.rotationMatrix):null;

      mat4.rotateY(this.matrix, this.matrix, this.azimuth * Math.PI / 180);
      mat4.rotateX(this.matrix, this.matrix, this.elevation * Math.PI / 180);

      mat4.translate(this.matrix, this.matrix, this.position);
    }

    // We only update the position if we have a tracking camera.
    // For an orbiting camera we do not update the position. If
    // Why do you think we do not update the position?
    if (this.isTracking()) {
      const position = vec4.create();
      vec4.set(position, 0, 0, 0, 1);
      vec4.transformMat4(position, position, this.matrix);
      vec3.copy(this.position, position);
    }

    this.calculateOrientation();

    if(this.isOrbiting()){
      this.lookAt(); //para la camara orbital
    }

     // this.logCamera()

  }

  logCamera(){
    //console.log this.position in a vector
    console.log(`posCamara: ${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}, ${this.position[2].toFixed(2)}`);
    // log this.azimuth
    console.log(`azimuth: ${this.azimuth.toFixed(2)}`);
    // log this.elevation
    console.log(`elevation: ${this.elevation.toFixed(2)}`);
  }
  // Returns the view transform
  getViewTransform() {
    const matrix = mat4.create();
    mat4.invert(matrix, this.matrix);
    return matrix;
  }

}

// Two defined modes for the camera
Camera.TYPES = ['ORBITING_TYPE', 'TRACKING_TYPE'];
Camera.TYPES.forEach(type => Camera[type] = type);

