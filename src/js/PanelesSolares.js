'use strict';
import {ConstruirBuffers} from "./ConstruirBuffers";


function OperacionesParaNormalizar() {
    this.restaArray = function (array1, array2) {
        let resultado = [];
        for (let i = 0; i < array1.length; i++) {
            resultado.push(array1[i] - array2[i]);
        }
        return resultado;
    };
    this.productoCruz = function (a, b) {
        return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    };
    this.normalizar = function (array) {
        let norm = Math.sqrt(array[0] ** 2 + array[1] ** 2 + array[2] ** 2);
        return [array[0] / norm, array[1] / norm, array[2] / norm];
    };
}
function TapaCalculos(radioDeLaTapa){
    let Phi = function (u){
        return 2 * Math.PI * u
    }
    let Radio = function (v){
        return radioDeLaTapa*v
    }
    this.getPosicion = function (u,v ){
        let phi = Phi(u);
        let radio = Radio(v)
        let x = radio * Math.cos(phi);
        let z = radio * Math.sin(phi);
        let y = 0
        return [x, y, z];
    }
    this.getNormal = function (u, v) {
        return [0,1,0]
    };
    this.getCoordenadasTextura = function (u, v) {
        return [v, u];
    };
}
function PlanoCalculos(dimensiones){

        this.getPosicion = function (u, v) {
            const x = (u - 0.5) * dimensiones.ancho;
            const z = (v - 0.5) * dimensiones.largo;
            return [x, 0, z];
        };

        this.getNormal = function (u, v) {
            return [0, 1, 0];
        };

        this.getCoordenadasTextura = function (u, v) {
            return [v, u];
        };
}
function TuboCalculos(dimensionesTubo){

    let Phi = function (u){
        return 2 * Math.PI * u
    }
    this.getPosicion = function (u,v ){
        let phi = Phi(u);
        let rho = dimensionesTubo.radio;
        let x = rho * Math.cos(phi);
        let z = rho * Math.sin(phi);
        let y = v * dimensionesTubo.altura;
        return [x, y, z];
    }
    let delta = 0.0001;
    this.getNormal = function (u, v) {
        let operacion = new OperacionesParaNormalizar();
        let punto_0 = this.getPosicion(u, v);
        let punto_1 = this.getPosicion(u , v + delta);
        let punto_2 = this.getPosicion(u + delta, v );

        let vectorParaNormal_1 = operacion.restaArray(punto_0, punto_1);
        let vectorParaNormal_2 = operacion.restaArray(punto_0, punto_2);
        /*
        if (u <= 0.5 && u !== 0) { //corrige cuando u=[0,2PI]
            let vectorAux = vectorParaNormal_1;
            vectorParaNormal_1 = vectorParaNormal_2;
            vectorParaNormal_2 = vectorAux;
        }*/
        let productoCruz = operacion.productoCruz(vectorParaNormal_1, vectorParaNormal_2);
        let normal =operacion.normalizar(productoCruz);
        let normalReal = [Math.cos(2 * Math.PI*u), 0, Math.sin(2 * Math.PI*u)];

        return normalReal;
    };
    this.getCoordenadasTextura = function (u, v) {
        return [v, u];
    };
}

export class Tubo{
    constructor(alias, dimensionesTubo)
    {
        this.alias = alias;
        this.vertices = [];
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
        this.wireframe = false;
        this.visible = true;
        this.dimensionesTubo = dimensionesTubo;
        this.construir();
    }
    construir(){
        const constructor = new ConstruirBuffers()

        const mallaTubo = constructor.construir(
            new TuboCalculos(this.dimensionesTubo),
            dimensionesTriangulos,
        )

        this.vertices = mallaTubo.positionBuffer;
        this.indices = mallaTubo.indexBuffer;
        this.normales = mallaTubo.normalBuffer;
    }
}

export class Tapa{
    constructor(alias,radio)
    {
        this.alias = alias;
        this.vertices = [];
        this.radio = radio
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
        this.wireframe = false;
        this.visible = true;
        this.construir();
    }
    construir(){
        const constructor = new ConstruirBuffers()

        const mallaTapa = constructor.construir(
            new TapaCalculos(this.radio),
            dimensionesTriangulos,
        )

        this.vertices = mallaTapa.positionBuffer;
        this.indices = mallaTapa.indexBuffer;
        this.normales = mallaTapa.normalBuffer;
    }
}

const dimensionesTriangulos = {
    filas: 1,
    columnas: 20,
}

const dimensionesTriangulosPlano = {
    filas: 1,
    columnas: 1,
}

export class Plano{
    constructor(alias, dimensiones)
    {
        this.alias = alias;
        this.vertices = [];
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
        this.wireframe = false;
        this.visible = true;
        this.dimensiones = dimensiones;
        this.construir();
    }
    construir(){
        const constructor = new ConstruirBuffers()

        const mallaPlano = constructor.construir(
            new PlanoCalculos(this.dimensiones),
            dimensionesTriangulosPlano,
        )

        this.vertices = mallaPlano.positionBuffer;
        this.indices = mallaPlano.indexBuffer;
        this.normales = mallaPlano.normalBuffer;
    }
}