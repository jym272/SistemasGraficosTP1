'use strict';


import {mat4, vec3} from "gl-matrix";

export const dimensiones = {
    profundidadModuloVioleta: 2.0,
    NucleoPS: {
        radio: 2.00,
        altura: 4.0,
    },
    CilindroNucleoPS: { //dimensiones de todos los nucleos
        radioSuperior: 1.6,
        radioInferior: 2.0, //NucleoPS.radio
        altura: 0.7,
    },
    anillo: {
        radio: 15.20,
        radioInterior: 0.8,
        distanciaEntreTubos: 0.40,
        tubo :{
            radio: 0.05,
            altura: 15.20 /*anillo.radio */ * 2,
        },
        tuboInterior : {
            radio: 0.05,
            altura: /*anillo.distanciaEntreTubos*/ 0.40 * 2 * Math.sqrt(2),
        }
    },
    /*  Constantes Paneles Solares */

    panelSolar: {
        tapa:{
            ancho : 1.3,
            largo : 6,
        },
        filasDeTubosSecundarios: 4, //Se comienza con 4 filas
        distanciaEntreTubosSecundarios: 2,
        fc: 2.15, //factor de correccion para el largo del tubo
        tuboPrincipal: {
            radio: 0.15,
            altura: 0, //se actualiza en el constructor de  PanelSolar
        },
        tuboSecundario : {
            radio: 0.05,
            altura: 2.0,
        },
        lado:{
            ancho: 0.1,
            largo: 1.3,
        }
    },
    pastillas : {
        cuerpo : {
            radio: 2.50,
            altura: 0.8,
        },
    },
    ajusteTierra :{
        radio: 1,
        coordenadas : [0,0,0],
        rotacion: [0,0,0],
    },
    ajusteLuna :{
        radio: 1,
        coordenadas : [0,0,0],
        rotacion: [0,0,0],
    },
    lightPosition : [
        [-2093, -1909, -440],
        [910, 180, -2080],
        [24, -408, -2073]
    ],
    //valores dependen del valor de random al incio del programa
    lunaCamaraInitValues : {
        0:{
            position: vec3.fromValues(0, 0, 1096.11),
            azimuth: 62.27,
            elevation: -59.86,
            focus: vec3.create()
        },
        1:{
            position: vec3.fromValues(0, 0, 1016.58),
            azimuth: -198.50,
            elevation: 24.76,
            focus: vec3.create()
        },
        2:{
            position: vec3.fromValues(0, 0, 1128.99),
            azimuth: -32.63,
            elevation: -15.46,
            focus: vec3.create()
        },
    },
    tierraCamaraInitValues : {
        0:{
            position: vec3.fromValues(0, 0, 4675.73),
            azimuth: -134.68,
            elevation: -25.55,
            focus: vec3.create()
        },
        1:{
            position: vec3.fromValues(0, 0, 4027.94),
            azimuth: 151.17,
            elevation: -8.18,
            focus: vec3.create()
        },
        2:{
            position: vec3.fromValues(0, 0, 4020.70),
            azimuth: -327.16,
            elevation: -14.65,
            focus: vec3.create()
        },
    },
    naveCamaraInitValues : {
        0:{
            position: vec3.fromValues(0, 0, 47.00),
            azimuth: -60.06,
            elevation: 28.55,
            focus: vec3.create()
        },
        1:{
            position: vec3.fromValues(0, 0, 47.91),
            azimuth: -53.58,
            elevation: -11.28,
            focus: vec3.create()
        },
        2:{
            position: vec3.fromValues(0, 0, 44.27),
            azimuth: -33.50,
            elevation: -11.37,
            focus: vec3.create()
        },
    },
    panelesSolaresCamaraInitValues : {
        0:{
            position: vec3.fromValues(0, 0, 17.94),
            azimuth: 57.79,
            elevation: -49.45,
            focus: vec3.create()
        },
        1:{
            position: vec3.fromValues(0, 0, 17.64),
            azimuth: 131.91,
            elevation: -21.56,
            focus: vec3.create()
        },
        2:{
            position: vec3.fromValues(0, 0, 13.24),
            azimuth: 227.39,
            elevation: -8.33,
            focus: vec3.create()
        },
    },
    capsulaCamaraInitValues : {
        0:{
            position: vec3.fromValues(0, 0, 7.92),
            azimuth: -149.82,
            elevation: 41.18,
            focus: vec3.create(),
            droneCameraControl: {
                position: [20.78,10.15,17.27],
                rotationMatrix: [
                    0.44,-0.23,-0.87,0.00,
                    -0.22,0.91,-0.35,0.00,
                    0.87,0.35,0.35,0.00,
                    0.00,0.00,0.00,1.00
                ],
            }
        },
        1:{
            position: vec3.fromValues(0, 0, 6.91),
            azimuth: -213.28,
            elevation: -27.86,
            focus: vec3.create(),
            droneCameraControl: {
                position: [-11.41,9.40,27.92],
                rotationMatrix: [
                    0.83,0.05,0.56,0.00,
                    0.18,0.92,-0.34,0.00,
                    -0.53,0.38,0.76,0.00,
                    0.00,0.00,0.00,1.00
                ],
            }
        },
        2:{
            position: vec3.fromValues(0, 0, 6.91),
            azimuth: -213.28,
            elevation: -27.86,
            focus: vec3.create(),
            droneCameraControl: {
                position: [19.21,6.36,16.50],
                rotationMatrix: [
                    0.36,-0.03,-0.94,0.00,
                    -0.18,0.98,-0.10,0.00,
                    0.91,0.21,0.34,0.00,
                    0.00,0.00,0.00,1.00
                ],
            }
        },
    },
};

