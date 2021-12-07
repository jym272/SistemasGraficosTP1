'use strict';
import {ConstruirBuffers} from "./ConstruirBuffers";
import {utils} from "./utils";
import {colores} from "./colores";

export class Superficie {

    constructor( dimensionesTriangulos, alias) {

        this.alias = alias;
        this.vertices = [];
        this.indices = [];
        this.textureCoords = [];
        this.normales = [];
        this.tangentes = [];
        this.diffuse = colores.RojoMetalico;
        this.visible = true;
        this.dimensionesTriangulos = dimensionesTriangulos;
        this.wireframe = false;

    }
    superficie(){

    }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)
        const malla = constructor.construir(this.superficie())

        this.vertices = malla.positionBuffer;
        this.indices = malla.indexBuffer;
        this.normales = malla.normalBuffer;
        this.textureCoords = malla.uvBuffer;
        this.tangentes = malla.tangenteBuffer;
    }
}

export class Cilindro extends Superficie {

    constructor(alias, dimensionesCilindro,dimensionesTriangulos, invertirNormales = false)
    {
        super(dimensionesTriangulos,alias)
        this.dimensionesCilindro = dimensionesCilindro;
        this.invertirNormales = invertirNormales;
        this.construir();

    }
    superficie(){
        const radioSuperior = this.dimensionesCilindro.radioSuperior
        const radioInferior = this.dimensionesCilindro.radioInferior
        const altura = this.dimensionesCilindro.altura
        const pendiente =  (radioInferior - radioSuperior) / altura;
        const invertirNormales = this.invertirNormales;
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
                const normal = utils.normalizarVector([Math.sin(phi), pendiente, Math.cos(phi)]);
                if (invertirNormales === true)
                    return normal.map(x => -x);
                else
                    return normal;
            },
            getCoordenadasTextura: function (u, v) {
                return [u, v];
            },
            getTangente: function (u, v) {
                const phi = 2 * Math.PI * u;
                const radioActual = v * (radioSuperior - radioInferior) + radioInferior;
                const alfa = 2 * Math.PI * radioActual;
                const Ru = [alfa * Math.cos(phi), 0, - alfa * Math.sin(phi)];
                const R = radioSuperior - radioInferior
                const Rv = [R*Math.sin(phi), altura, R*Math.cos(phi)];
                const suma = Ru.map((x, i) => x + Rv[i]);
                const tangente = utils.normalizarVector(suma);
                if (invertirNormales === true)
                    return tangente.map(x => -x);
                else
                    return tangente;
            }
        }
    }
}

export class Tubo extends Superficie{

    constructor(alias, dimensionesTubo,dimensionesTriangulos)
    {
        super(dimensionesTriangulos, alias)
        this.dimensionesTubo = dimensionesTubo;
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
                    return [u, v];
                },
                getTangente: function (u, v) {
                    const phi = 2 * Math.PI * u;
                    const R = 2 * Math.PI * radio;
                    return utils.normalizarVector([-R * Math.sin(phi), altura, R * Math.cos(phi)]);
                },
            }
    }
}

export class Tapa extends Superficie{
    constructor(alias,radio, dimensionesTriangulos)
    {
        super(dimensionesTriangulos, alias)
        this.radio = radio
        this.construir();
    }
    superficie(){
        const radio = this.radio
        return {
            getPosicion: function (u, v) {
                const phi = 2 * Math.PI * u;
                const x = radio * v * Math.cos(phi);
                const z = radio * v * Math.sin(phi);
                const y = 0
                return [x, y, z];
            },
            getNormal: function (u, v) {
                return [0,1,0]
            },
            getCoordenadasTextura: function (u, v) {
                return [u, v];
            },
            getTangente: function (u, v) {
                const alfa = 2 * Math.PI * radio * v;
                const phi = 2 * Math.PI * u;
                const Ru = [- alfa * Math.sin(phi), 0 , alfa * Math.cos(phi)];
                const Rv = [radio * Math.cos(phi), 0,  radio * Math.sin(phi)];
                const vectorTangente = Ru.map((x, i) => x + Rv[i]);
                return utils.normalizarVector(vectorTangente);
            }
        }
    }
}

export class Plano extends Superficie{
    constructor(alias, dimensiones, dimensionesTriangulos)
    {
        super(dimensionesTriangulos, alias)
        this.dimensiones = dimensiones;
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
            getTangente: function (u, v) {
                return [0,0,0]
            }
        }
    }
}

export class Torus extends Superficie{
    constructor( alias,radius = 1, tube = 0.4,
                 dimensionesTriangulos,
                 arc = Math.PI * 2){

        super(dimensionesTriangulos, alias)
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
             getTangente: function (u, v) {
                 return [0,0,0]
             }
         }

     }
}

