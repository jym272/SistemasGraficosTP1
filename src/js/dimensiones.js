'use strict';


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

    //lo de abajao es una funcion, refactorizar cuando funcione.
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
    ]
};

