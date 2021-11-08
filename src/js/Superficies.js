'use strict';
import {ConstruirBuffers} from "./ConstruirBuffers";
import * as THREE from 'three';
import { Matrix4,  Shape, Vector3, Vector4} from "three";


export class Superficie {

    constructor( dimensionesTriangulos ) {

        this.vertices = [];
        this.indices = [];
        this.textureCoords = [];
        this.normales = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0] //rojo metalico
        this.visible = true;
        this.dimensionesTriangulos = dimensionesTriangulos;
        this.wireframe = false;

    }
    superficie(){

    }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)
        const mallaTapa = constructor.construir(this.superficie())

        this.vertices = mallaTapa.positionBuffer;
        this.indices = mallaTapa.indexBuffer;
        this.normales = mallaTapa.normalBuffer;
        this.textureCoords = mallaTapa.uvBuffer;
    }
}


export class Cilindro{

    constructor(alias, dimensionesCilindro,dimensionesTriangulos)
    {
        this.alias = alias;
        this.vertices = [];
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
        this.textureCoords = [];
        this.wireframe = false;
        this.visible = true;
        this.dimensionesCilindro = dimensionesCilindro;
        this.dimensionesTriangulos = dimensionesTriangulos;
        this.construir();

    }
    superficie(){
        const radioSuperior = this.dimensionesCilindro.radioSuperior
        const radioInferior = this.dimensionesCilindro.radioInferior
        const altura = this.dimensionesCilindro.altura
        const pendiente =  (radioInferior - radioSuperior) / altura;
        return {
            getPosicion: function (u, v) {

                const radioActual = v * (radioSuperior - radioInferior) + radioInferior;
                const phi = 2 * Math.PI * u;

                const x = radioActual * Math.sin(phi);
                const y = v * altura ;
                const z = radioActual * Math.cos(phi);
                return [x, y, z];
            },
            getNormal: function (u, v) {
                const phi = 2 * Math.PI * u;
                const normal = [Math.sin(phi), pendiente, Math.cos(phi)]
                 //normalize vector
                const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
                return [normal[0] / length, normal[1] / length, normal[2] / length];

            },
            getCoordenadasTextura: function (u, v) {
                return [u, 1-v];
            },
        }
    }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)
        const mallaTubo = constructor.construir(this.superficie())

        this.vertices = mallaTubo.positionBuffer;
        this.indices = mallaTubo.indexBuffer;
        this.normales = mallaTubo.normalBuffer;
        this.textureCoords = mallaTubo.uvBuffer;
    }
}

export class Tubo{

    constructor(alias, dimensionesTubo,dimensionesTriangulos)
    {
        this.alias = alias;
        this.vertices = [];
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
        this.textureCoords = [];
        this.wireframe = false;
        this.visible = true;
        this.dimensionesTubo = dimensionesTubo;
        this.dimensionesTriangulos = dimensionesTriangulos;
        this.construir();
    }
    superficie(){
        const radio = this.dimensionesTubo.radio
        const altura = this.dimensionesTubo.altura
        return {
                getPosicion: function (u, v) {
                    const phi = 2 * Math.PI * u;
                    const rho = radio;
                    const x = rho * Math.cos(phi);
                    const z = rho * Math.sin(phi);
                    const y = v * altura;
                    return [x, y, z];
                },
                getNormal: function (u, v) {
                    const phi = 2 * Math.PI * u;
                    return [Math.cos(phi), 0, Math.sin(phi)];
                },
                getCoordenadasTextura: function (u, v) {
                    return [u, 1-v];
                },
            }
    }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)
        const mallaTubo = constructor.construir(this.superficie())

        this.vertices = mallaTubo.positionBuffer;
        this.indices = mallaTubo.indexBuffer;
        this.normales = mallaTubo.normalBuffer;
        this.textureCoords = mallaTubo.uvBuffer;

    }
}

export class Tapa{
    constructor(alias,radio, dimensionesTriangulos)
    {
        this.alias = alias;
        this.vertices = [];
        this.radio = radio
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
        this.textureCoords = [];
        this.wireframe = false;
        this.visible = true;
        this.dimensionesTriangulos = dimensionesTriangulos;
        this.construir();
    }
    superficie(){
        const radio = this.radio
        return {
            getPosicion: function (u, v) {
                let phi = 2 * Math.PI * u;
                let x = radio * v * Math.cos(phi);
                let z = radio * v * Math.sin(phi);
                let y = 0
                return [x, y, z];
            },
            getNormal: function (u, v) {
                return [0,1,0]
            },
            getCoordenadasTextura: function (u, v) {
                return [u, v];
            },
        }
    }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)

        const mallaTapa = constructor.construir(this.superficie())

        this.vertices = mallaTapa.positionBuffer;
        this.indices = mallaTapa.indexBuffer;
        this.normales = mallaTapa.normalBuffer;
        this.textureCoords = mallaTapa.uvBuffer;

    }
}

export class Plano{
    constructor(alias, dimensiones, dimensionesTriangulos)
    {
        this.alias = alias;
        this.vertices = [];
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
        this.textureCoords = [];
        this.wireframe = false;
        this.visible = true;
        this.dimensiones = dimensiones;
        this.dimensionesTriangulos = dimensionesTriangulos;
        this.construir();
    }
    superficie(){
        const ancho = this.dimensiones.ancho
        const largo = this.dimensiones.largo
        return {
            getPosicion: function (u, v) {
                const x = (u - 0.5) * ancho;
                const z = (v - 0.5) * largo;
                return [x, 0, z];
            },
            getNormal: function (u, v) {
                return [0,1,0]
            },
            getCoordenadasTextura: function (u, v) {
                return [u, v];
            },
        }
    }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)

        const mallaPlano = constructor.construir(this.superficie())

        this.vertices = mallaPlano.positionBuffer;
        this.indices = mallaPlano.indexBuffer;
        this.normales = mallaPlano.normalBuffer;
        this.textureCoords = mallaPlano.uvBuffer;

    }
}

export class Torus{
    constructor( alias,radius = 1, tube = 0.4,
                 dimensionesTriangulos,
                 arc = Math.PI * 2){

        this.alias = alias;
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.dimensionesTriangulos = dimensionesTriangulos;
        this.normales = [];
        this.vertices = [];
        this.indices = [];
        this.textureCoords = [];
        this.wireframe = false;
        this.visible = true;
        this.arc = arc
        this.radius = radius
        this.tube = tube
        this.construir();
    }
     superficie(){

        const arc = this.arc
        const radius = this.radius
        const tube = this.tube
         return {
             //u es tubularSegments(dim tr columnas) y v es radialSegments (dim tr filas)
             getPosicion: function (u, v) {

                 v =  Math.PI * 2 *v
                 u = u * arc

                 const x = ( radius + tube * Math.cos( v ) ) * Math.cos( u );
                 const y = ( radius + tube * Math.cos( v ) ) * Math.sin( u );
                 const z = tube * Math.sin( v );

                 return [x, y, z];
             },
             getNormal: function (u, v) {

                 const vertex = this.getPosicion(u,v);

                 u = u * arc
                 const center = [];
                 const normal = [];

                 center[0] = radius * Math.cos( u );
                 center[1] = radius * Math.sin( u );
                 center[2] = 0

                 normal[0] = vertex[0] - center[0]
                 normal[1] = vertex[1] - center[1]
                 normal[2] = vertex[2] - center[2]

                 const len = Math.sqrt( normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2] );
                 normal[0] /= len;
                 normal[1] /= len;
                 normal[2] /= len;
                 return [normal[0], normal[1], normal[2] ];
             },
             getCoordenadasTextura: function (u, v) {
                 return [u, v];
             },
         }

     }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)

        const mallaPlano = constructor.construir(this.superficie())
        this.vertices = mallaPlano.positionBuffer;
        this.indices = mallaPlano.indexBuffer;
        this.normales = mallaPlano.normalBuffer;
        this.textureCoords = mallaPlano.uvBuffer
    }
}


// columnas son las divisiones, filas -> v, columnas -> u
// filas-> el paso discreto del camino / columnas -> el paso discreto de la forma
export class SuperficieParametrica extends  Superficie{
    constructor(alias,puntosForma,puntosRecorrido,dimensionesTriangulos)
    {
        super(dimensionesTriangulos)
        this.alias = alias;
        this.puntosForma = puntosForma
        this.puntosRecorrido = puntosRecorrido

        //curva de recorrido

        const curve = new THREE.CubicBezierCurve(
            new THREE.Vector2( 0, 0 ),
            new THREE.Vector2( 1, 1 ),
            new THREE.Vector2( 2, 1.3 ),
            new THREE.Vector2( 3, 1.3 ),
        )

        const divisionesRecorrido = this.dimensionesTriangulos.filas
        this.puntosRecorrido =curve.getPoints(divisionesRecorrido)

        this.arrayTangentes= []
        //con for llenar el array
        for (let i = 0; i <= divisionesRecorrido; i++) {
            const tan = curve.getTangent(i/divisionesRecorrido)
            const nuevotan3= new Vector3(0,tan.y,tan.x)
            this.arrayTangentes.push(nuevotan3)
        }

        const normal = new Vector3(1,0,0)

        //calculo de binormal con el array de tangentes y normal
        this.binormales = []
        for (let i = 0; i < this.arrayTangentes.length; i++) {
            const tangente = this.arrayTangentes[i]
            const binormal = new Vector3().crossVectors(tangente, normal)
            binormal.normalize()
            this.binormales.push(binormal)
        }


        this.construir();
    }
    superficie() {
        const puntos = this.puntosForma
        let i = 0
        let j = 0
        const anchoDelCuadrado = 4
        const vectorBinormales = this.binormales
        const vectorTangentes = this.arrayTangentes
        const puntosRecorrido = this.puntosRecorrido

        let vectorTransformado
        let puntoActual
        return {
            // columnas son las divisiones, filas -> v, columnas -> u
            // filas-> el paso discreto del camino / columnas -> el paso discreto de la form

            getPosicion: function (u, v) {
                //recorre todos los puntos de u respecto a v (0...1,0)
                //luego (0...1, 1) ..etc

                const [x, y] = puntos[i]

                //recorrrido
                const vBinormalActual = vectorBinormales[j]
                const vTangenteActual = vectorTangentes[j]
                puntoActual = puntosRecorrido[j]


                const nuevamatrixDeNivel = new Matrix4()
                nuevamatrixDeNivel.set(
                    1,vBinormalActual.x,vTangenteActual.x,0,
                    0,vBinormalActual.y,vTangenteActual.y,puntoActual.y,
                    0,vBinormalActual.z,vTangenteActual.z,puntoActual.x,
                    0,0,0,1
                )

                const matrixDeNivel = new Matrix4();
                const z_ = anchoDelCuadrado *v
                matrixDeNivel.set(
                    1,0,0,0,
                    0,1,0,0,
                    0,0,1,z_,
                    0,0,0,1
                )
                //la normal seria la misma que la posicion
                const vector = new Vector4(x,y,0,1)
                vectorTransformado =vector.applyMatrix4( nuevamatrixDeNivel )



                return [vectorTransformado.x,vectorTransformado.y,vectorTransformado.z]
                //return [x, y, anchoDelCuadrado*v];
            },


            getNormal(u,v){
                // simula la normal, funciona mejor con formas muy redondas, y no planas

                const [x_noTransformado, y_noTransformado] = puntos[i]

                let x =  vectorTransformado.x
                const y =  vectorTransformado.y - puntoActual.y
                const z = vectorTransformado.z - puntoActual.x

                i++ //voy al sig punto
                if(u===1){
                    i=0 //me di una vuelta de la forma, termine un nivel, vuelvo al inicio para el sig nivel
                    j++ //avanzo al sig nivel
                }

                /*
                 * Configuracion de la normal para un cubo con lados redondeados
                 */
                //las caras verticales tienen la normal en el eje x
                if(x_noTransformado ===2 )
                    return [1, 0, 0]
                else if(x_noTransformado ===-2)
                    return [-1,0,0]
                //para la normal en las caras horizontales solo se tiene en cuenta los ejes y z
                if(y_noTransformado ===2 || y_noTransformado ===-2) {
                    x = 0
                }
                ////////////////////////////////////////////////////////////////////

                const normal = new Vector3(x,y,z).normalize()
                return [normal.x,normal.y,normal.z]
            },
            getCoordenadasTextura: function (u, v) {
                return [u, 1-v];
            },
        }
    }
}
