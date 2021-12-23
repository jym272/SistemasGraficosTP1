'use strict';

// Encapsulates common light functionality
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
    constructor(gl, program) {

        this.gl = gl;
        this.program = program;

        // this.vector = [0, 0, 0];
        // this.azimuth = azimuth;
        // this.elevation = elevation;
        // this.azimuthElevationToVector();
    }

    validarAngulos() {
        if (this.azimuth < 0 || this.azimuth > 360) {
            this.azimuth = this.azimuth % 360;
        }
        if (this.elevation < 0 || this.elevation > 360) {
            this.elevation = this.elevation % 360;
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
        this.printNewVector();
    }

    printNewVector() {
        console.clear()
        console.log(`${this.azimuth.toFixed(1)}° azimuth, ${this.elevation.toFixed(1)}° elevation`);
        console.log(`-> ${this.vector[0].toFixed(2)}, ${this.vector[1].toFixed(2)}, ${this.vector[2].toFixed(2)}`);
    }

    cambiarAzimuth(incremento, valor = null) {
        if(valor === null){
            this.azimuth += incremento;
        }else{
            this.azimuth = valor;
        }
        this.azimuthElevationToVector();
        this.actualizarEnLaEscena();
    }

    cambiarElevation(incremento, valor = null) {
        if(valor === null){
            this.elevation += incremento;
        }else{
            this.elevation = valor;
        }
        this.azimuthElevationToVector();
        this.actualizarEnLaEscena();
    }

    actualizarEnLaEscena() {
        const {gl, program} = this;

        this.lightArray[3] = this.vector[0];
        this.lightArray[4] = this.vector[1];
        this.lightArray[5] = this.vector[2];

        this.lightArray[6] = this.vector[0];
        this.lightArray[7] = this.vector[1];
        this.lightArray[8] = this.vector[2];

        gl.uniform3fv(program.uLightDirection, this.lightArray);
    }

    esteEsElLightsArray(lightsArrayDirection) {
        this.lightArray = lightsArrayDirection;
        //por ahora el vector de green y blue deben tener la misma direccion
        this.lightArray[6] = this.lightArray[3];
        this.lightArray[7] = this.lightArray[4];
        this.lightArray[8] = this.lightArray[5];

        this.vector = [this.lightArray[3], this.lightArray[4], this.lightArray[5]];

        this.azimuth = Math.atan2(this.vector[2], this.vector[0]) * 180 / Math.PI;
        this.elevation = Math.atan2(this.vector[1], Math.sqrt(this.vector[0] * this.vector[0] + this.vector[2] * this.vector[2])) * 180 / Math.PI;
        this.validarAngulos();
    }

}
