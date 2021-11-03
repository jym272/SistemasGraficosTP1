'use strict';
import {ConstruirBuffers} from "./ConstruirBuffers";
import {vec3} from "gl-matrix";

export class Tubo{

    constructor(alias, dimensionesTubo,dimensionesTriangulos)
    {
        this.alias = alias;
        this.vertices = [];
        this.indices = [];
        this.diffuse = [0.71875,0.0,0.1796,1.0]
        this.normales = [];
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
                    let phi = 2 * Math.PI * u;
                    let rho = radio;
                    let x = rho * Math.cos(phi);
                    let z = rho * Math.sin(phi);
                    let y = v * altura;
                    return [x, y, z];
                },
                getNormal: function (u, v) {
                    return [Math.cos(2 * Math.PI * u), 0, Math.sin(2 * Math.PI * u)];
                },
                getCoordenadasTextura: function (u, v) {
                    return [u, v];
                },
            }
    }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)
        const mallaTubo = constructor.construir(this.superficie())

        this.vertices = mallaTubo.positionBuffer;
        this.indices = mallaTubo.indexBuffer;
        this.normales = mallaTubo.normalBuffer;
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
    }
}


 class Torus1{
    constructor( alias,radius = 1, tube = 0.4,
                 radialSegments = 8, tubularSegments = 6,
                 arc = Math.PI * 2 ){

        this.alias = alias;
        this.diffuse = [0.71875,0.0,0.1796,1.0]

        this.normales = [];
        this.vertices = [];
        this.indices = [];
        this.wireframe = false;
        this.visible = true;
        this.construir();
    }
    construir(){
        const constructor = new ConstruirBuffers()

        const mallaPlano = constructor.construir(
            new TorusCalculos(this.dimensiones),
            dimensionesTriangulosPlano,
        )

        this.vertices = mallaPlano.positionBuffer;
        this.indices = mallaPlano.indexBuffer;
        this.normales = mallaPlano.normalBuffer;
    }
}

export class Torus{

    constructor( alias,radius = 1, tube = 0.4, radialSegments = 8, tubularSegments = 6, arc = Math.PI * 2 ) {

        this.alias = alias;
       this.diffuse = [0.71875,0.0,0.1796,1.0]

        this.wireframe = false;
        this.parameters = {
            radius: radius,
            tube: tube,
            radialSegments: radialSegments,
            tubularSegments: tubularSegments,
            arc: arc
        };

        radialSegments = Math.floor( radialSegments );
        tubularSegments = Math.floor( tubularSegments );

        // buffers

        this.indices = [];
        this.vertices = [];
        this.normales = [];
        this.textureCoords = [];

        // helper variables
        const center = vec3.create();
        const vertex = vec3.create();
        let normal = vec3.create();

        // generate vertices, normals and uvs

        for ( let j = 0; j <= radialSegments; j ++ ) {

            for ( let i = 0; i <= tubularSegments; i ++ ) {

                const u = i / tubularSegments * arc;
                const v = j / radialSegments * Math.PI * 2;

                // vertex

                vertex.x = ( radius + tube * Math.cos( v ) ) * Math.cos( u );
                vertex.y = ( radius + tube * Math.cos( v ) ) * Math.sin( u );
                vertex.z = tube * Math.sin( v );

                this.vertices.push( vertex.x, vertex.y, vertex.z );

                // normal

                center.x = radius * Math.cos( u );
                center.y = radius * Math.sin( u );
                center.z = 0


                normal.x = vertex.x - center.x
                normal.y = vertex.y - center.y
                normal.z = vertex.z - center.z

                const len = Math.sqrt( normal.x * normal.x + normal.y * normal.y + normal.z * normal.z );
                normal.x /= len;
                normal.y /= len;
                normal.z /= len;


                this.normales.push( normal.x, normal.y, normal.z );

                // uv

                this.textureCoords.push( i / tubularSegments );
                this.textureCoords.push( j / radialSegments );

            }

        }

        // generate indices

        for ( let j = 1; j <= radialSegments; j ++ ) {

            for ( let i = 1; i <= tubularSegments; i ++ ) {

                // indices

                const a = ( tubularSegments + 1 ) * j + i - 1;
                const b = ( tubularSegments + 1 ) * ( j - 1 ) + i - 1;
                const c = ( tubularSegments + 1 ) * ( j - 1 ) + i;
                const d = ( tubularSegments + 1 ) * j + i;

                // faces

                this.indices.push( a, b, d );
                this.indices.push( b, c, d );

            }

        }

        // build geometry
        /*
        console.log(this.indices)
        console.log(this.vertices)
        console.log(this.normales)
        console.log(this.textureCoords)

         */
        /*
        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

         */

    }
}

