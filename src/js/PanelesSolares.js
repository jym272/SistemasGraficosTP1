'use strict';
import {ConstruirBuffers} from "./ConstruirBuffers";
import {vec3} from "gl-matrix";

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
    setDiffuse(diffuse){
        this.diffuse = diffuse;
        return this;
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
                 const center = vec3.create();
                 const normal = vec3.create();

                 center.x = radius * Math.cos( u );
                 center.y = radius * Math.sin( u );
                 center.z = 0

                 normal.x = vertex[0] - center.x
                 normal.y = vertex[1] - center.y
                 normal.z = vertex[2] - center.z


                 const len = Math.sqrt( normal.x * normal.x + normal.y * normal.y + normal.z * normal.z );
                 normal.x /= len;
                 normal.y /= len;
                 normal.z /= len;
                 return [normal.x, normal.y, normal.z ];
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
