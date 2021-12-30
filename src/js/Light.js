'use strict';

// Encapsulates common light functionality
import {vec3} from "gl-matrix";
import {Capsula} from "./TransformacionesAfin";

export class Light {

    constructor(id) {
        this.id = id;
        this.position = [0, 0, 0];

        // We could use the OBJ convention here (e.g. Ka, Kd, Ks, etc.),
        // but decided to use more prescriptive terms here to showcase
        // both versions
        this.ambient = [0, 0, 0, 0];
        this.diffuse = [0, 0, 0, 0];
        this.specular = [0, 0, 0, 0];
        // this.direction = [0,0,0] se inicia al inicio con setProperty
    }

    setDirection(direction){
        this.direction = direction.slice(0);
    }

    setPosition(position) {
        this.position = position.slice(0);
    }

    setDiffuse(diffuse) {
        this.diffuse = diffuse.slice(0);
    }

    setAmbient(ambient) {
        this.ambient = ambient.slice(0);
    }

    setSpecular(specular) {
        this.specular = specular.slice(0);
    }

    setProperty(property, value) {
        this[property] = value;
    }

}

// Helper class to maintain a collection of lights
export class LightsManager {

    constructor() {
        this.list = [];
    }

    add(light) {
        if (!(light instanceof Light)) {
            console.error('The parameter is not a light');
            return;
        }
        this.list.push(light);
    }

    getArray(type) {
        return this.list.reduce((result, light) => {
            result = result.concat(light[type]);
            return result;
        }, []);
    }

    get(index) {
        if (typeof index === 'string') {
            return this.list.find(light => light.id === index);
        } else {
            return this.list[index];
        }
    }
}
export class DireccionSpotLight {
    constructor(lights) {
        this.lights = lights;
        this.stack = [];
        this.originalDirection={
            vector: [0,0,0],
            azimuth: 0,
            elevation: 0
        }
        this.umbralDeDireccion = 30;
        this.luzSpotLightEncendida = true

    }
    activarLuces(){
        this.luzSpotLightEncendida = true
    }
    lucesBlancas(){
        const luzBlanca = Capsula.spotLights.blanca.diffuse;

        this.lights.get('redLight').setDiffuse(luzBlanca);
        this.lights.get('greenLight').setDiffuse(luzBlanca);


    }
    lucesRG(){
        const greenDiffuse = Capsula.spotLights.green.diffuse;
        const redDiffuse = Capsula.spotLights.red.diffuse;

        this.lights.get('redLight').setDiffuse(redDiffuse);
        this.lights.get('greenLight').setDiffuse(greenDiffuse);

    }
    apagarLuces(){
        this.luzSpotLightEncendida = false
    }

    validarAngulos() {
        if (this.azimuth < 0 || this.azimuth > 360) {
            this.azimuth = this.azimuth % 360;
        }
        if (this.elevation < 0 || this.elevation > 360) {
            this.elevation = this.elevation % 360;
        }
        return {
            azimuth: this.azimuth,
            elevation: this.elevation
        }
    }

    azimuthElevationToVector() {
        this.validarAngulos();
        const {azimuth, elevation} = this;
        const theta = azimuth * Math.PI / 180;
        const phi = elevation * Math.PI / 180;
        const x = Math.cos(phi) * Math.cos(theta);
        const z = Math.cos(phi) * Math.sin(theta);
        const y = Math.sin(phi);
        this.vector = [x, y, z];
        // this.printNewVector();
    }

    printNewVector() {
        console.clear()
        console.log(`${this.azimuth.toFixed(1)}° azimuth, ${this.elevation.toFixed(1)}° elevation`);
        console.log(`-> ${this.vector[0].toFixed(2)}, ${this.vector[1].toFixed(2)}, ${this.vector[2].toFixed(2)}`);
    }

    cambiarAzimuth(incremento, valor = null) {
        if(valor === null){
            this.azimuth += incremento;
            if(Math.abs(this.azimuth+90) > this.umbralDeDireccion){
                this.azimuth -= incremento;
                return;
            }
        }else{
            this.azimuth = valor;
        }
        this.azimuthElevationToVector();
    }

    cambiarElevation(incremento, valor = null) {
        if(valor === null){
            this.elevation += incremento;
            if(Math.abs(this.elevation) > this.umbralDeDireccion){ //valor hardcodeado tomando en cuanta la direccion inicial de la spotlight
                this.elevation -= incremento;
                return;
            }
        }else{
            this.elevation = valor;
        }
        this.azimuthElevationToVector();
    }

    actualizarEnLaEscena(newVector = null) {

       const {vector} = this;
/*
        this.lightArray[3] = vector[0];
        this.lightArray[4] = vector[1];
        this.lightArray[5] = vector[2];

        this.lightArray[6] = vector[0];
        this.lightArray[7] = vector[1];
        this.lightArray[8] = vector[2];

 */

        this.lights.get('redLight').setDirection(vector);
        this.lights.get('greenLight').setDirection(vector);


        this.pop();

    }
    cambiarDireccionCon(rotationMatrix){

        this.push(); //guardo el vector direccion original
        vec3.transformMat4(this.vector, this.vector, rotationMatrix);
        this.actualizarEnLaEscena();
    }
    // Pushes  direction vector onto the stack
    push() {
        const copyVector = this.vector.slice(0);
        this.stack.push(copyVector);
    }

    // Pops and returns diretion vector off the stack
    pop() {
        return this.stack.length
            ? this.vector = this.stack.pop()
            : null;
    }

    esteEsElLightsArray(lightsArrayDirection) {
        this.lightArray = lightsArrayDirection;
        //por ahora el vector de green y blue deben tener la misma direccion
        this.lightArray[6] = this.lightArray[3];
        this.lightArray[7] = this.lightArray[4];
        this.lightArray[8] = this.lightArray[5];

        this.vector = [this.lightArray[3], this.lightArray[4], this.lightArray[5]];

        this.originalDirection.vector = this.vector.slice(0);
        this.calculateAzimuthElevation();
    }
    calculateAzimuthElevation() {
        this.azimuth = Math.atan2(this.vector[2], this.vector[0]) * 180 / Math.PI;
        this.elevation = Math.atan2(this.vector[1], Math.sqrt(this.vector[0] * this.vector[0] + this.vector[2] * this.vector[2])) * 180 / Math.PI;
        const {azimuth,elevation} = this.validarAngulos();
        this.originalDirection.azimuth = azimuth;
        this.originalDirection.elevation = elevation;
    }
    setOriginalDirectionVector(){
        this.pop();
        this.vector = this.originalDirection.vector.slice(0);
        this.elevation = this.originalDirection.elevation;
        this.azimuth = this.originalDirection.azimuth;
    }

}
