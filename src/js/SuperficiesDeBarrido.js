
'use strict';

import {CurvaCubicaDeBezier} from "./CurvasDeBezier";
import {Superficie} from "./Superficies";

export class Forma {

    constructor(  ) {
        this.curvas = [];
        this.puntoActual = [0,0]; // x,y
    }
    actualizarPuntoActual( x, y ) {

        this.puntoActual[0] = x;
        this.puntoActual[1] = y;

        return this;

    }
    extraerPuntos( divisiones = 12 ) {

        const puntos = [];
        const puntosTangentes = [];

        let last;
        for ( let i = 0, curvas = this.curvas; i < curvas.length; i ++ ) {

            const curva = curvas[ i ];

            let pts,tan
            if(curva && curva.type === 'CurvaDeBezier'){ //solo tengo lineas o bezier
                const {puntos, tangentes} = curva.getPoints( divisiones ) //puntos de bezier
                pts = puntos
                tan = tangentes  //tangentes de bezier, solo trabajo con estas siguiendo la forma: linea,bezier, linea,bezier, etc
                if(tan) {
                    puntosTangentes.push(...tan) //acumula las tangentes si existen
                }
            }else{
                pts = curva
            }

            for ( let j = 0; j < pts.length; j ++ ) {

                const punto = pts[ j ];

                if ( last && last[0] === punto[0] && last[1] === punto[1] ) continue; // Avoid dupes!

                puntos.push( punto );

                last = punto;
            }

        }
        return{
            puntos,
            puntosTangentes
        };
    }
    clonarPuntoActual() {
        const puntoActualX = this.puntoActual[0];
        const puntoActualY = this.puntoActual[1];

        return [puntoActualX, puntoActualY];

    }

    CurvaBezierA( aCP1x, aCP1y, aCP2x, aCP2y, aX, aY ) {

        const curva = new CurvaCubicaDeBezier(
            this.clonarPuntoActual(),
            [aCP1x, aCP1y],
            [aCP2x, aCP2y ],
            [aX, aY ]
        );

        this.curvas.push( curva );

        this.actualizarPuntoActual( aX, aY );

        return this;

    }
    iniciarEn( x, y ) {

        this.actualizarPuntoActual(x, y)
        return this;

    }

    lineaA( x, y ) {

        const curva = [ this.clonarPuntoActual() , [ x, y ]]
        this.curvas.push( curva );

        this.actualizarPuntoActual( x, y );

        return this;

    }
}



// columnas son las divisiones, filas -> v, columnas -> u
// filas-> el paso discreto del camino / columnas -> el paso discreto de la forma
export class TapaSuperficieParametrica extends Superficie{
    constructor(alias, puntosDeLaForma,dimensionesTriangulos)
    {
        super(dimensionesTriangulos)
        this.alias = alias;
        this.puntosDeLaForma = puntosDeLaForma;
        this.construir();


    }
    superficie(){
        const puntos = this.puntosDeLaForma
        let i =0
        return {
            getPosicion: function (u, v) {
                const x = v * puntos[i][0]
                const z = v * puntos[i][1]
                const y = 0
                i++
                if (u === 1) {
                    i = 0
                }

                return[x,y,z]
            },
            getNormal(u,v){
                return [0,1,0] //es una tapa
            },
            getCoordenadasTextura: function (u, v) {
                return [u, 1-v];
            },
        }
    }

}

