
'use strict';

import {CurvaCubicaDeBezier} from "./CurvasDeBezier";
import {Superficie} from "./Superficies";
import {mat4, vec4} from "gl-matrix";
import {utils} from "./utils";

export class Forma {

    constructor(  ) {
        this.curvas = [];
        this.puntoActual = [0,0]; // x,y
        this.esCurvaCerrada = false
    }
    curvaCerrada(boolean){
        this.esCurvaCerrada = boolean;
    }
    actualizarPuntoActual( x, y ) {

        this.puntoActual[0] = x;
        this.puntoActual[1] = y;

        return this;

    }
    extraerPuntos( divisiones = 12 ) {

        const puntos = [];
        const PuntosTangentes = [];
        let last;
        for ( let i = 0, curvas = this.curvas; i < curvas.length; i ++ ) {

            const curva = curvas[ i ];

            let pts,tan;
            if(curva && curva.type === 'CurvaDeBezier'){ //solo tengo lineas o bezier
                const {puntos, puntosTangentes} = curva.extraerPuntos( divisiones ) //puntos de bezier
                pts = puntos
                tan = puntosTangentes  //tangentes de bezier, solo trabajo con estas siguiendo la forma: linea,bezier, linea,bezier, etc
                PuntosTangentes.push(...tan)
            }else{
                pts = curva
            }

            for ( let j = 0; j < pts.length; j ++ ) {

                const punto = pts[ j ];

                if ( last && last[0] === punto[0] && last[1] === punto[1] ) {

                    continue; // Avoid dupes!

                }

                puntos.push( punto );

                last = punto;
            }

        }
        if(this.esCurvaCerrada === true){
            PuntosTangentes.push(PuntosTangentes[0])
        }
        return{
            puntos,
            puntosTangentes : PuntosTangentes
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
        super(dimensionesTriangulos, alias)
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

// columnas son las divisiones, filas -> v, columnas -> u
// filas-> el paso discreto del camino / columnas -> el paso discreto de la forma
export class SuperficieParametrica extends  Superficie{
    constructor(alias,datosDeLaForma, datosDelRecorrido,dimensionesTriangulos, recorridoXY = false)
    {
        super(dimensionesTriangulos, alias)
        this.datosDelRecorrido = datosDelRecorrido
        this.datosDeLaForma = datosDeLaForma
        this.recorridoXY = recorridoXY
        this.construir();
    }
    superficie() {
        let i = 0
        let j = 0
        const recorrido = this.datosDelRecorrido
        const recorridoXY = this.recorridoXY
        const forma = this.datosDeLaForma
        let normalTransformada
        return {
            // columnas son las divisiones, filas -> v, columnas -> u
            // filas-> el paso discreto del camino / columnas -> el paso discreto de la form
            getPosicion: function (u, v) {
                //recorre todos los puntos de u respecto a v (0...1,0)
                //luego (0...1, 1) ..etc

                const[verticeFormaX, verticeFormaY] = forma.puntos[i]
                const[normalesFormaX, normalesFormaY] = forma.normales[i]

                const vectorBinormal = recorrido.binormales[j]
                const vectorTangente = recorrido.tangentes[j]
                const puntoRecorrido = recorrido.puntos[j]
                const vectorNormal = recorrido.vectorNormal


                const matrizDeNivel = mat4.create();
                (recorridoXY)?
                mat4.set(
                    matrizDeNivel,
                    vectorNormal[0], vectorBinormal[0], vectorTangente[0], puntoRecorrido[0],
                    vectorNormal[1], vectorBinormal[1], vectorTangente[1], puntoRecorrido[1],
                    vectorNormal[2], vectorBinormal[2], vectorTangente[2], 0,
                    0, 0, 0, 1
                ):mat4.set(
                        matrizDeNivel,
                        vectorNormal[0], vectorBinormal[0], vectorTangente[0], 0,
                        vectorNormal[1], vectorBinormal[1], vectorTangente[1], puntoRecorrido[1],
                        vectorNormal[2], vectorBinormal[2], vectorTangente[2], puntoRecorrido[0],
                        0, 0, 0, 1
                    );
                mat4.transpose(matrizDeNivel, matrizDeNivel) //debido al ingreso(poco intuitivo) de la matriz en forma de columnas
                const verticesTransformados = vec4.create()
                vec4.set(
                    verticesTransformados,
                    verticeFormaX, verticeFormaY, 0, 1)
                vec4.transformMat4(verticesTransformados, verticesTransformados, matrizDeNivel )

                const matrizDeNivelInversa = mat4.create()
                mat4.set(
                    matrizDeNivelInversa,
                    vectorNormal[0], vectorBinormal[0], vectorTangente[0], 0,
                    vectorNormal[1], vectorBinormal[1], vectorTangente[1], 0,
                    vectorNormal[2], vectorBinormal[2], vectorTangente[2], 0,
                    0, 0, 0, 1
                )
                mat4.transpose(matrizDeNivelInversa, matrizDeNivelInversa)
                normalTransformada = vec4.create()
                vec4.set(
                    normalTransformada,
                    normalesFormaX,
                    normalesFormaY,0, 1)
                vec4.transformMat4(normalTransformada, normalTransformada, matrizDeNivelInversa)

                return [verticesTransformados[0],verticesTransformados[1],verticesTransformados[2]]
            },
            getNormal(u,v){
                i++ //voy al sig punto
                if(u===1){
                    i=0 //me di una vuelta de la forma, termine un nivel, vuelvo al inicio para el sig nivel
                    j++ //avanzo al sig nivel
                }
                const normal = utils.normalizarVector([normalTransformada[0],normalTransformada[1],normalTransformada[2]])
                return [normal[0],normal[1],normal[2]]
            },
            getCoordenadasTextura: function (u, v) {
                return [u, 1-v];
            },
        }
    }
}
