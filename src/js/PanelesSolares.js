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





/*
class CylinderGeometry extends BufferGeometry {

    constructor( radiusTop = 1, radiusBottom = 1, height = 1,
                 radialSegments = 8,
                 heightSegments = 1, openEnded = false, thetaStart = 0,
                 thetaLength = Math.PI * 2 ) {

        super();
        this.type = 'CylinderGeometry';

        this.parameters = {
            radiusTop: radiusTop,
            radiusBottom: radiusBottom,
            height: height,
            radialSegments: radialSegments,
            heightSegments: heightSegments,
            openEnded: openEnded,
            thetaStart: thetaStart,
            thetaLength: thetaLength
        };

        const scope = this;

        radialSegments = Math.floor( radialSegments );
        heightSegments = Math.floor( heightSegments );

        // buffers

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // helper variables

        let index = 0;
        const indexArray = [];
        const halfHeight = height / 2;
        let groupStart = 0;

        // generate geometry

        generateTorso();

        if ( openEnded === false ) {

            if ( radiusTop > 0 ) generateCap( true );
            if ( radiusBottom > 0 ) generateCap( false );

        }

        // build geometry

        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

        function generateTorso() {

            const normal = new Vector3();
            const vertex = new Vector3();

            let groupCount = 0;

            // this will be used to calculate the normal
            const slope = ( radiusBottom - radiusTop ) / height;

            // generate vertices, normals and uvs

            for ( let y = 0; y <= heightSegments; y ++ ) {

                const indexRow = [];

                const v = y / heightSegments;

                // calculate the radius of the current row

                const radius = v * ( radiusBottom - radiusTop ) + radiusTop;

                for ( let x = 0; x <= radialSegments; x ++ ) {

                    const u = x / radialSegments;

                    const theta = u * thetaLength + thetaStart;

                    const sinTheta = Math.sin( theta );
                    const cosTheta = Math.cos( theta );

                    // vertex

                    vertex.x = radius * sinTheta;
                    vertex.y = - v * height + halfHeight;
                    vertex.z = radius * cosTheta;
                    vertices.push( vertex.x, vertex.y, vertex.z );

                    // normal

                    normal.set( sinTheta, slope, cosTheta ).normalize();
                    normals.push( normal.x, normal.y, normal.z );

                    // uv

                    uvs.push( u, 1 - v );

                    // save index of vertex in respective row

                    indexRow.push( index ++ );

                }

                // now save vertices of the row in our index array

                indexArray.push( indexRow );

            }

            // generate indices

            for ( let x = 0; x < radialSegments; x ++ ) {

                for ( let y = 0; y < heightSegments; y ++ ) {

                    // we use the index array to access the correct indices

                    const a = indexArray[ y ][ x ];
                    const b = indexArray[ y + 1 ][ x ];
                    const c = indexArray[ y + 1 ][ x + 1 ];
                    const d = indexArray[ y ][ x + 1 ];

                    // faces

                    indices.push( a, b, d );
                    indices.push( b, c, d );

                    // update group counter

                    groupCount += 6;

                }

            }

            // add a group to the geometry. this will ensure multi material support

            scope.addGroup( groupStart, groupCount, 0 );

            // calculate new start value for groups

            groupStart += groupCount;

        }

        function generateCap( top ) {

            // save the index of the first center vertex
            const centerIndexStart = index;

            const uv = new Vector2();
            const vertex = new Vector3();

            let groupCount = 0;

            const radius = ( top === true ) ? radiusTop : radiusBottom;
            const sign = ( top === true ) ? 1 : - 1;

            // first we generate the center vertex data of the cap.
            // because the geometry needs one set of uvs per face,
            // we must generate a center vertex per face/segment

            for ( let x = 1; x <= radialSegments; x ++ ) {

                // vertex

                vertices.push( 0, halfHeight * sign, 0 );

                // normal

                normals.push( 0, sign, 0 );

                // uv

                uvs.push( 0.5, 0.5 );

                // increase index

                index ++;

            }

            // save the index of the last center vertex
            const centerIndexEnd = index;

            // now we generate the surrounding vertices, normals and uvs

            for ( let x = 0; x <= radialSegments; x ++ ) {

                const u = x / radialSegments;
                const theta = u * thetaLength + thetaStart;

                const cosTheta = Math.cos( theta );
                const sinTheta = Math.sin( theta );

                // vertex

                vertex.x = radius * sinTheta;
                vertex.y = halfHeight * sign;
                vertex.z = radius * cosTheta;
                vertices.push( vertex.x, vertex.y, vertex.z );

                // normal

                normals.push( 0, sign, 0 );

                // uv

                uv.x = ( cosTheta * 0.5 ) + 0.5;
                uv.y = ( sinTheta * 0.5 * sign ) + 0.5;
                uvs.push( uv.x, uv.y );

                // increase index

                index ++;

            }

            // generate indices

            for ( let x = 0; x < radialSegments; x ++ ) {

                const c = centerIndexStart + x;
                const i = centerIndexEnd + x;

                if ( top === true ) {

                    // face top

                    indices.push( i, i + 1, c );

                } else {

                    // face bottom

                    indices.push( i + 1, i, c );

                }

                groupCount += 3;

            }

            // add a group to the geometry. this will ensure multi material support

            scope.addGroup( groupStart, groupCount, top === true ? 1 : 2 );

            // calculate new start value for groups

            groupStart += groupCount;

        }

    }

    static fromJSON( data ) {

        return new CylinderGeometry( data.radiusTop, data.radiusBottom, data.height, data.radialSegments, data.heightSegments, data.openEnded, data.thetaStart, data.thetaLength );

    }

}


 */

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
