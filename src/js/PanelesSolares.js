'use strict';
import {ConstruirBuffers, ConstruirBuffersTest} from "./ConstruirBuffers";
import * as THREE from 'three';
import {BufferGeometry, Float32BufferAttribute, Matrix4, Shape, ShapeUtils, Vector2, Vector3, Vector4} from "three";


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


class Curve {

    constructor() {

        this.type = 'Curve';

        this.arcLengthDivisions = 200;

    }

    // Virtual base class method to overwrite and implement in subclasses
    //	- t [0 .. 1]

    getPoint( /* t, optionalTarget */ ) {

        console.warn( 'THREE.Curve: .getPoint() not implemented.' );
        return null;

    }

    // Get point at relative position in curve according to arc length
    // - u [0 .. 1]

    getPointAt( u, optionalTarget ) {

        const t = this.getUtoTmapping( u );
        return this.getPoint( t, optionalTarget );

    }

    // Get sequence of points using getPoint( t )

    getPoints( divisions = 5 ) {

        const points = [];

        for ( let d = 0; d <= divisions; d ++ ) {

            points.push( this.getPoint( d / divisions ) );

        }

        return points;

    }

    // Get sequence of points using getPointAt( u )

    getSpacedPoints( divisions = 5 ) {

        const points = [];

        for ( let d = 0; d <= divisions; d ++ ) {

            points.push( this.getPointAt( d / divisions ) );

        }

        return points;

    }

    // Get total curve arc length

    getLength() {

        const lengths = this.getLengths();
        return lengths[ lengths.length - 1 ];

    }

    // Get list of cumulative segment lengths

    getLengths( divisions = this.arcLengthDivisions ) {

        if ( this.cacheArcLengths &&
            ( this.cacheArcLengths.length === divisions + 1 ) &&
            ! this.needsUpdate ) {

            return this.cacheArcLengths;

        }

        this.needsUpdate = false;

        const cache = [];
        let current, last = this.getPoint( 0 );
        let sum = 0;

        cache.push( 0 );

        for ( let p = 1; p <= divisions; p ++ ) {

            current = this.getPoint( p / divisions );
            sum += current.distanceTo( last );
            cache.push( sum );
            last = current;

        }

        this.cacheArcLengths = cache;

        return cache; // { sums: cache, sum: sum }; Sum is in the last element.

    }

    updateArcLengths() {

        this.needsUpdate = true;
        this.getLengths();

    }

    // Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equidistant

    getUtoTmapping( u, distance ) {

        const arcLengths = this.getLengths();

        let i = 0;
        const il = arcLengths.length;

        let targetArcLength; // The targeted u distance value to get

        if ( distance ) {

            targetArcLength = distance;

        } else {

            targetArcLength = u * arcLengths[ il - 1 ];

        }

        // binary search for the index with largest value smaller than target u distance

        let low = 0, high = il - 1, comparison;

        while ( low <= high ) {

            i = Math.floor( low + ( high - low ) / 2 ); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

            comparison = arcLengths[ i ] - targetArcLength;

            if ( comparison < 0 ) {

                low = i + 1;

            } else if ( comparison > 0 ) {

                high = i - 1;

            } else {

                high = i;
                break;

                // DONE

            }

        }

        i = high;

        if ( arcLengths[ i ] === targetArcLength ) {

            return i / ( il - 1 );

        }

        // we could get finer grain at lengths, or use simple interpolation between two points

        const lengthBefore = arcLengths[ i ];
        const lengthAfter = arcLengths[ i + 1 ];

        const segmentLength = lengthAfter - lengthBefore;

        // determine where we are between the 'before' and 'after' points

        const segmentFraction = ( targetArcLength - lengthBefore ) / segmentLength;

        // add that fractional amount to t

        const t = ( i + segmentFraction ) / ( il - 1 );

        return t;

    }

    // Returns a unit vector tangent at t
    // In case any sub curve does not implement its tangent derivation,
    // 2 points a small delta apart will be used to find its gradient
    // which seems to give a reasonable approximation

    getTangent( t, optionalTarget ) {

        const delta = 0.0001;
        let t1 = t - delta;
        let t2 = t + delta;

        // Capping in case of danger

        if ( t1 < 0 ) t1 = 0;
        if ( t2 > 1 ) t2 = 1;

        const pt1 = this.getPoint( t1 );
        const pt2 = this.getPoint( t2 );

        const tangent = optionalTarget || ( ( pt1.isVector2 ) ? new Vector2() : new Vector3() );

        tangent.copy( pt2 ).sub( pt1 ).normalize();

        return tangent;

    }

    getTangentAt( u, optionalTarget ) {

        const t = this.getUtoTmapping( u );
        return this.getTangent( t, optionalTarget );

    }

    computeFrenetFrames( segments, closed ) {

        // see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

        const normal = new Vector3();

        const tangents = [];
        const normals = [];
        const binormals = [];

        const vec = new Vector3();
        const mat = new Matrix4();

        // compute the tangent vectors for each segment on the curve

        for ( let i = 0; i <= segments; i ++ ) {

            const u = i / segments;

            tangents[ i ] = this.getTangentAt( u, new Vector3() );

        }

        // select an initial normal vector perpendicular to the first tangent vector,
        // and in the direction of the minimum tangent xyz component

        normals[ 0 ] = new Vector3();
        binormals[ 0 ] = new Vector3();
        let min = Number.MAX_VALUE;
        const tx = Math.abs( tangents[ 0 ].x );
        const ty = Math.abs( tangents[ 0 ].y );
        const tz = Math.abs( tangents[ 0 ].z );

        if ( tx <= min ) {

            min = tx;
            normal.set( 1, 0, 0 );

        }

        if ( ty <= min ) {

            min = ty;
            normal.set( 0, 1, 0 );

        }

        if ( tz <= min ) {

            normal.set( 0, 0, 1 );

        }

        vec.crossVectors( tangents[ 0 ], normal ).normalize();

        normals[ 0 ].crossVectors( tangents[ 0 ], vec );
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


        // compute the slowly-varying normal and binormal vectors for each segment on the curve

        for ( let i = 1; i <= segments; i ++ ) {

            normals[ i ] = normals[ i - 1 ].clone();

            binormals[ i ] = binormals[ i - 1 ].clone();

            vec.crossVectors( tangents[ i - 1 ], tangents[ i ] );

            if ( vec.length() > Number.EPSILON ) {

                vec.normalize();

                const theta = Math.acos( clamp( tangents[ i - 1 ].dot( tangents[ i ] ), - 1, 1 ) ); // clamp for floating pt errors

                normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

            }

            binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

        }

        // if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

        if ( closed === true ) {

            let theta = Math.acos( clamp( normals[ 0 ].dot( normals[ segments ] ), - 1, 1 ) );
            theta /= segments;

            if ( tangents[ 0 ].dot( vec.crossVectors( normals[ 0 ], normals[ segments ] ) ) > 0 ) {

                theta = - theta;

            }

            for ( let i = 1; i <= segments; i ++ ) {

                // twist a little...
                normals[ i ].applyMatrix4( mat.makeRotationAxis( tangents[ i ], theta * i ) );
                binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

            }

        }

        return {
            tangents: tangents,
            normals: normals,
            binormals: binormals
        };

    }

    clone() {

        return new this.constructor().copy( this );

    }

    copy( source ) {

        this.arcLengthDivisions = source.arcLengthDivisions;

        return this;

    }

}

//

function CubicBezierP0( t, p ) {

    const k = 1 - t;
    return k * k * k * p;

}

function CubicBezierP1( t, p ) {

    const k = 1 - t;
    return 3 * k * k * t * p;

}

function CubicBezierP2( t, p ) {

    return 3 * ( 1 - t ) * t * t * p;

}

function CubicBezierP3( t, p ) {

    return t * t * t * p;

}

function CubicBezier( t, p0, p1, p2, p3 ) {

    return CubicBezierP0( t, p0 ) + CubicBezierP1( t, p1 ) + CubicBezierP2( t, p2 ) +
        CubicBezierP3( t, p3 );

}




//

function QuadraticBezierP0( t, p ) {

    const k = 1 - t;
    return k * k * p;

}

function QuadraticBezierP1( t, p ) {

    return 2 * ( 1 - t ) * t * p;

}

function QuadraticBezierP2( t, p ) {

    return t * t * p;

}

function QuadraticBezier( t, p0, p1, p2 ) {

    return QuadraticBezierP0( t, p0 ) + QuadraticBezierP1( t, p1 ) +
        QuadraticBezierP2( t, p2 );

}

class QuadraticBezierCurve {

    constructor( v0 = [0,0], v1 =  [0,0], v2 =  [0,0] ) {



        this.type = 'QuadraticBezierCurve';

        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;

    }
    // Get sequence of points using getPoint( t )

    getPoints( divisions = 5 ) {

        const points = [];

        for ( let d = 0; d <= divisions; d ++ ) {

            points.push( this.getPoint( d / divisions ) );

        }

        return points;

    }

    getPoint( t, optionalTarget = [0,0] ) {

        const point = optionalTarget;

        const v0 = this.v0, v1 = this.v1, v2 = this.v2;

        point[0] = QuadraticBezier( t, v0[0], v1[0], v2[0] );
        point[1] = QuadraticBezier( t, v0[1], v1[1], v2[1] );

        return point;

    }

    copy( source ) {

        super.copy( source );

        this.v0.copy( source.v0 );
        this.v1.copy( source.v1 );
        this.v2.copy( source.v2 );

        return this;

    }

}




class CubicBezierCurve{

    constructor( v0 = [0,0], v1 = [0,0], v2 = [0,0], v3 = [0,0] ) {


        this.type = 'CubicBezierCurve';

        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;

    }
    // Get sequence of points using getPoint( t )

    getPoints( divisions = 5 ) {

        const points = [];

        for ( let d = 0; d <= divisions; d ++ ) {

            points.push( this.getPoint( d / divisions ) );

        }

        return points;

    }

    getPoint( t, optionalTarget = [0,0]) {

        const point = optionalTarget;

        const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

        point[0] = CubicBezier( t, v0[0], v1[0], v2[0], v3[0] )
        point[1] = CubicBezier( t, v0[1], v1[1], v2[1], v3[1] )
        return point;

    }

    copy( source ) {

        super.copy( source );

        this.v0.copy( source.v0 );
        this.v1.copy( source.v1 );
        this.v2.copy( source.v2 );
        this.v3.copy( source.v3 );

        return this;

    }

}

export class Test{
    constructor() {

        //create a simple bezier curve

        const curve = new CubicBezierCurve(
            [-1,0],
            [0,1],
            [1,0],
            [0,-1]
        )
        const points = curve.getPoints( 15 )

        console.log(points)

    }

}


export class TapaTest{

                            // columnas son las divisiones, filas -> v, columnas -> u
                                       // filas-> el paso discreto del camino / columnas -> el paso discreto de la forma
    constructor(alias,radio, dimensionesTriangulos = {filas:1,columnas:52})
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


        const shape = new Shape();
        shape.moveTo(2,1.5)
        shape.bezierCurveTo(2,1.8,1.8,2,1.5,2)
        shape.lineTo(-1.5,2)
        shape.bezierCurveTo(-1.8,2,-2,1.8,-2,1.5)
        shape.lineTo(-2,-1.5)
        shape.bezierCurveTo(-2,-1.8,-1.8,-2,-1.5,-2)
        shape.lineTo(1.5,-2)
        shape.bezierCurveTo(1.8,-2,2,-1.8,2,-1.5)
        shape.lineTo(2,1.5)


        const nuevosPuntos = shape.extractPoints(12).shape

        this.points = nuevosPuntos;

        this.construir();


    }
    superficie(){
        const puntos = this.points
        let i =0
        const anchoDelCuadrado = 4
        return {

            getPosicion: function (u, v) {
                const x = v * puntos[i].x
                const z = v * puntos[i].y
                const y = 0
                i++
                if (u === 1) {
                    i = 0
                }

              return[x,y,z]
            },



            getNormal(u,v){

                return [0,1,0]
            },

            getCoordenadasTextura: function (u, v) {
                return [u, 1-v];
            },
        }
    }
    construir(){
        const constructor = new ConstruirBuffers(this.dimensionesTriangulos)

        const mallaTapa = constructor.construir(this.superficie())



        const position = [];

        for (let i = 0, l = this.points.length; i < l; i++) {

            const point = this.points[i];
            position.push(point[0], point[1], point[2] || 0);
        }

        //this.setAttribute('position', new Float32BufferAttribute(position, 3));


        //IDEA REPETIR TODOS LOS PUNTOS PERO CON DIFERENTE Z
        //this.setAttribute('position', new Float32BufferAttribute(position, 3));

        this.vertices = mallaTapa.positionBuffer;
        this.indices = mallaTapa.indexBuffer;
        this.normales = mallaTapa.normalBuffer;
        this.textureCoords = mallaTapa.uvBuffer;

    }
}





export class SupTest{              // columnas son las divisiones, filas -> v, columnas -> u
                                   // filas-> el paso discreto del camino / columnas -> el paso discreto de la forma
    constructor(alias,radio, dimensionesTriangulos = {filas:10,columnas:52})
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


        const shape = new Shape();
        shape.moveTo(2,1.5)
        shape.bezierCurveTo(2,1.8,1.8,2,1.5,2)
        shape.lineTo(-1.5,2)
        shape.bezierCurveTo(-1.8,2,-2,1.8,-2,1.5)
        shape.lineTo(-2,-1.5)
        shape.bezierCurveTo(-2,-1.8,-1.8,-2,-1.5,-2)
        shape.lineTo(1.5,-2)
        shape.bezierCurveTo(1.8,-2,2,-1.8,2,-1.5)
        shape.lineTo(2,1.5)




        const nuevosPuntos = shape.extractPoints(12).shape
        this.points = nuevosPuntos;


        //curva de recorrido

        const curve = new THREE.CubicBezierCurve(
            new THREE.Vector2( 0, 0 ),
            new THREE.Vector2( 1, 1 ),
            new THREE.Vector2( 2, 1.3 ),
            new THREE.Vector2( 3, 1.3 ),
        )

        const divisionesRecorrido = this.dimensionesTriangulos.filas
        this.puntosRecorrido =curve.getPoints(divisionesRecorrido)
        console.log(this.puntosRecorrido)

        this.arrayTangentes= []
        //con for llenar el array
        for (let i = 0; i <= divisionesRecorrido; i++) {
            const tan = curve.getTangent(i/divisionesRecorrido)
            const nuevotan3= new Vector3(0,tan.y,tan.x)
            this.arrayTangentes.push(nuevotan3)
        }
        
        console.log(this.arrayTangentes)


        const normal = new Vector3(1,0,0)

        //calculo de binormal con el array de tangentes y normal
        this.binormales = []
        for (let i = 0; i < this.arrayTangentes.length; i++) {
            const tangente = this.arrayTangentes[i]
            const binormal = new Vector3().crossVectors(tangente, normal)
            binormal.normalize()
            this.binormales.push(binormal)
        }

        console.log(this.binormales)






        this.construir();


    }
    superficie() {
        const puntos = this.points
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
                //console.log(u,v)
                //recorre todos los puntos de u respecto a v (0...1,0)
                //luego (0...1, 1) ..etc
                /*
                const x =  puntos[i][0]
                const y =  puntos[i][1]


                 */
                const x =  puntos[i].x
                const y =  puntos[i].y
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
               // console.log(nuevamatrixDeNivel)

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
                /*
                const x =  puntos[i][0]
                const y =  puntos[i][1]


                 */
                const x =  vectorTransformado.x
                const y =  vectorTransformado.y - puntoActual.y
                const z = vectorTransformado.z - puntoActual.x

                i++
                if(u===1){
                    i=0
                    j++
                }
                const normal = new Vector3(x,y,z).normalize()
                return [normal.x,normal.y,normal.z]
            },

            /*
            getNormal: function (u, v) {
                //calcular la normal de la superfice usando 3 puntos con getPosicion
                //calcular la normal de la superfice usando 3 puntos con getPosicion
                const delta = 0.001

                const posicion1 = this.getPosicion(u,v)
                const posicion2 = this.getPosicion(u-delta,v)
                const posicion3 = this.getPosicion(u,v+delta)

                const vector1 = new Vector3(posicion1[0],posicion1[1],posicion1[2])
                const vector2 = new Vector3(posicion2[0],posicion2[1],posicion2[2])
                const vector3 = new Vector3(posicion3[0],posicion3[1],posicion3[2])


                const vector1_2 = vector1.sub(vector2)
                const vector1_3 = vector1.sub(vector3)
                console.log(vector1_2)
                console.log(vector1_3)
                const normal = vector1_2.cross(vector1_3)//.normalize()


                return [normal.x,normal.y,normal.z]

            },


             */
            getCoordenadasTextura: function (u, v) {
                return [u, 1-v];
            },
        }
    }
    construir(){
        const constructor = new ConstruirBuffersTest(this.dimensionesTriangulos)

        const mallaTapa = constructor.construir(this.superficie())



            const position = [];

            for (let i = 0, l = this.points.length; i < l; i++) {

                const point = this.points[i];
                position.push(point[0], point[1], point[2] || 0);
            }

            //this.setAttribute('position', new Float32BufferAttribute(position, 3));


        //IDEA REPETIR TODOS LOS PUNTOS PERO CON DIFERENTE Z
        //this.setAttribute('position', new Float32BufferAttribute(position, 3));
        
        this.vertices = mallaTapa.positionBuffer;
        this.indices = mallaTapa.indexBuffer;
        this.normales = mallaTapa.normalBuffer;
        this.textureCoords = mallaTapa.uvBuffer;

    }
}

export class Test1{
    constructor() {
        const shape = new THREE.Shape();
        shape.moveTo(2,0)
        shape.lineTo(2,1.5)
        shape.bezierCurveTo(2,1.8,1.8,2,1.5,2)
        shape.lineTo(-1.5,2)
        shape.bezierCurveTo(-1.8,2,-2,1.8,-2,1.5)
        shape.lineTo(-2,-1.5)
        shape.bezierCurveTo(-2,-1.8,-1.8,-2,-1.5,-2)
        shape.lineTo(1.5,-2)
        shape.bezierCurveTo(1.8,-2,2,-1.8,2,-1.5)
        shape.lineTo(2,0)


        const Radio = 4
        const factor = (2* 1.41421356237 - 1)/2
        const curveExtrude1 = new THREE.QuadraticBezierCurve3(

            new THREE.Vector3( Radio*1, 0, 0 ),
            new THREE.Vector3( Radio*factor, Radio*factor, 0 ),
            new THREE.Vector3( 0, Radio*1, 0 )
        );


        console.log(shape)
        console.log(curveExtrude1)

        const extrudeSettings = {
            steps: 10,
            depth: 1.7,
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelOffset: 0,
            extrudePath : curveExtrude1,
            bevelSegments: 68,

            curveSegments: 10,
        };

        const material = new THREE.MeshNormalMaterial({
            wireframe: true,
            wireframeLinewidth: 1
        })
        const geometry = new ExtrudeGeometry( shape, extrudeSettings );
        const extrude = new THREE.Mesh( geometry, material ) ;

        console.log(geometry.attributes.normal.array)
        console.log(geometry.attributes.position.array)
    }


}






class ExtrudeGeometry extends BufferGeometry {

    constructor( shapes = new Shape( [ new Vector2( 0.5, 0.5 ), new Vector2( - 0.5, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), options = {} ) {

        super();

        this.type = 'ExtrudeGeometry';

        this.parameters = {
            shapes: shapes,
            options: options
        };

        shapes = Array.isArray( shapes ) ? shapes : [ shapes ];

        const scope = this;

        const verticesArray = [];
        const uvArray = [];

        for ( let i = 0, l = shapes.length; i < l; i ++ ) {

            const shape = shapes[ i ];
            addShape( shape );

        }

        // build geometry

        this.setAttribute( 'position', new Float32BufferAttribute( verticesArray, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvArray, 2 ) );

        this.computeVertexNormals();

        console.log(this)

        // functions

        function addShape( shape ) {

            const placeholder = [];

            // options

            const curveSegments = options.curveSegments !== undefined ? options.curveSegments : 12;
            const steps = options.steps !== undefined ? options.steps : 1;
            let depth = options.depth !== undefined ? options.depth : 1;


            const extrudePath = options.extrudePath;

            const uvgen = options.UVGenerator !== undefined ? options.UVGenerator : WorldUVGenerator;

            // deprecated options

            if ( options.amount !== undefined ) {

                console.warn( 'THREE.ExtrudeBufferGeometry: amount has been renamed to depth.' );
                depth = options.amount;

            }

            //

            let extrudePts, extrudeByPath = false;
            let splineTube, binormal, normal, position2;

            if ( extrudePath ) {

                extrudePts = extrudePath.getSpacedPoints( steps );

                extrudeByPath = true;

                // SETUP TNB variables

                // TODO1 - have a .isClosed in spline?

                splineTube = extrudePath.computeFrenetFrames( steps, false );

                // console.log(splineTube, 'splineTube', splineTube.normals.length, 'steps', steps, 'extrudePts', extrudePts.length);

                binormal = new Vector3();
                normal = new Vector3();
                position2 = new Vector3();

            }



            // Variables initialization

            const shapePoints = shape.extractPoints( curveSegments );

            let vertices = shapePoints.shape;
            const holes = shapePoints.holes;

            const reverse = ! ShapeUtils.isClockWise( vertices );

            if ( reverse ) {

                vertices = vertices.reverse();

                // Maybe we should also check if holes are in the opposite direction, just to be safe ...

                for ( let h = 0, hl = holes.length; h < hl; h ++ ) {

                    const ahole = holes[ h ];

                    if ( ShapeUtils.isClockWise( ahole ) ) {

                        holes[ h ] = ahole.reverse();

                    }

                }

            }


            const faces = ShapeUtils.triangulateShape( vertices, holes );

            /* Vertices */

            const contour = vertices; // vertices has all points but contour has only points of circumference

            for ( let h = 0, hl = holes.length; h < hl; h ++ ) {

                const ahole = holes[ h ];

                vertices = vertices.concat( ahole );

            }


            function scalePt2( pt, vec, size ) {

                if ( ! vec ) console.error( 'THREE.ExtrudeGeometry: vec does not exist' );

                return vec.clone().multiplyScalar( size ).add( pt );

            }

            const vlen = vertices.length, flen = faces.length;


            // Find directions for point movement


            function getBevelVec( inPt, inPrev, inNext ) {

                // computes for inPt the corresponding point inPt' on a new contour
                //   shifted by 1 unit (length of normalized vector) to the left
                // if we walk along contour clockwise, this new contour is outside the old one
                //
                // inPt' is the intersection of the two lines parallel to the two
                //  adjacent edges of inPt at a distance of 1 unit on the left side.

                let v_trans_x, v_trans_y, shrink_by; // resulting translation vector for inPt

                // good reading for geometry algorithms (here: line-line intersection)
                // http://geomalgorithms.com/a05-_intersect-1.html

                const v_prev_x = inPt.x - inPrev.x,
                    v_prev_y = inPt.y - inPrev.y;
                const v_next_x = inNext.x - inPt.x,
                    v_next_y = inNext.y - inPt.y;

                const v_prev_lensq = ( v_prev_x * v_prev_x + v_prev_y * v_prev_y );

                // check for collinear edges
                const collinear0 = ( v_prev_x * v_next_y - v_prev_y * v_next_x );

                if ( Math.abs( collinear0 ) > Number.EPSILON ) {

                    // not collinear

                    // length of vectors for normalizing

                    const v_prev_len = Math.sqrt( v_prev_lensq );
                    const v_next_len = Math.sqrt( v_next_x * v_next_x + v_next_y * v_next_y );

                    // shift adjacent points by unit vectors to the left

                    const ptPrevShift_x = ( inPrev.x - v_prev_y / v_prev_len );
                    const ptPrevShift_y = ( inPrev.y + v_prev_x / v_prev_len );

                    const ptNextShift_x = ( inNext.x - v_next_y / v_next_len );
                    const ptNextShift_y = ( inNext.y + v_next_x / v_next_len );

                    // scaling factor for v_prev to intersection point

                    const sf = ( ( ptNextShift_x - ptPrevShift_x ) * v_next_y -
                            ( ptNextShift_y - ptPrevShift_y ) * v_next_x ) /
                        ( v_prev_x * v_next_y - v_prev_y * v_next_x );

                    // vector from inPt to intersection point

                    v_trans_x = ( ptPrevShift_x + v_prev_x * sf - inPt.x );
                    v_trans_y = ( ptPrevShift_y + v_prev_y * sf - inPt.y );

                    // Don't normalize!, otherwise sharp corners become ugly
                    //  but prevent crazy spikes
                    const v_trans_lensq = ( v_trans_x * v_trans_x + v_trans_y * v_trans_y );
                    if ( v_trans_lensq <= 2 ) {

                        return new Vector2( v_trans_x, v_trans_y );

                    } else {

                        shrink_by = Math.sqrt( v_trans_lensq / 2 );

                    }

                } else {

                    // handle special case of collinear edges

                    let direction_eq = false; // assumes: opposite

                    if ( v_prev_x > Number.EPSILON ) {

                        if ( v_next_x > Number.EPSILON ) {

                            direction_eq = true;

                        }

                    } else {

                        if ( v_prev_x < - Number.EPSILON ) {

                            if ( v_next_x < - Number.EPSILON ) {

                                direction_eq = true;

                            }

                        } else {

                            if ( Math.sign( v_prev_y ) === Math.sign( v_next_y ) ) {

                                direction_eq = true;

                            }

                        }

                    }

                    if ( direction_eq ) {

                        // console.log("Warning: lines are a straight sequence");
                        v_trans_x = - v_prev_y;
                        v_trans_y = v_prev_x;
                        shrink_by = Math.sqrt( v_prev_lensq );

                    } else {

                        // console.log("Warning: lines are a straight spike");
                        v_trans_x = v_prev_x;
                        v_trans_y = v_prev_y;
                        shrink_by = Math.sqrt( v_prev_lensq / 2 );

                    }

                }

                return new Vector2( v_trans_x / shrink_by, v_trans_y / shrink_by );

            }


            const contourMovements = [];

            for ( let i = 0, il = contour.length, j = il - 1, k = i + 1; i < il; i ++, j ++, k ++ ) {

                if ( j === il ) j = 0;
                if ( k === il ) k = 0;

                //  (j)---(i)---(k)
                // console.log('i,j,k', i, j , k)

                contourMovements[ i ] = getBevelVec( contour[ i ], contour[ j ], contour[ k ] );

            }

            const holesMovements = [];
            let oneHoleMovements, verticesMovements = contourMovements.concat();
            for ( let h = 0, hl = holes.length; h < hl; h ++ ) {

                const ahole = holes[ h ];

                oneHoleMovements = [];

                for ( let i = 0, il = ahole.length, j = il - 1, k = i + 1; i < il; i ++, j ++, k ++ ) {

                    if ( j === il ) j = 0;
                    if ( k === il ) k = 0;

                    //  (j)---(i)---(k)
                    oneHoleMovements[ i ] = getBevelVec( ahole[ i ], ahole[ j ], ahole[ k ] );

                }

                holesMovements.push( oneHoleMovements );
                verticesMovements = verticesMovements.concat( oneHoleMovements );

            }
            console.log(holesMovements)

            // Back facing vertices

            for ( let i = 0; i < vlen; i ++ ) {

                const vert =  vertices[ i ];

                if ( ! extrudeByPath ) {

                    v( vert.x, vert.y, 0 );

                } else {

                    // v( vert.x, vert.y + extrudePts[ 0 ].y, extrudePts[ 0 ].x );

                    normal.copy( splineTube.normals[ 0 ] ).multiplyScalar( vert.x );
                    binormal.copy( splineTube.binormals[ 0 ] ).multiplyScalar( vert.y );

                    position2.copy( extrudePts[ 0 ] ).add( normal ).add( binormal );

                    v( position2.x, position2.y, position2.z );

                }

            }

            // Add stepped vertices...
            // Including front facing vertices

            for ( let s = 1; s <= steps; s ++ ) {

                for ( let i = 0; i < vlen; i ++ ) {

                    const vert = vertices[ i ];

                    if ( ! extrudeByPath ) {

                        v( vert.x, vert.y, depth / steps * s );

                    } else {

                        // v( vert.x, vert.y + extrudePts[ s - 1 ].y, extrudePts[ s - 1 ].x );

                        normal.copy( splineTube.normals[ s ] ).multiplyScalar( vert.x );
                        binormal.copy( splineTube.binormals[ s ] ).multiplyScalar( vert.y );

                        position2.copy( extrudePts[ s ] ).add( normal ).add( binormal );

                        v( position2.x, position2.y, position2.z );

                    }

                }

            }

            /* Faces */

            // Top and bottom faces

            buildLidFaces();

            // Sides faces

            buildSideFaces();


            /////  Internal functions

            function buildLidFaces() {

                const start = verticesArray.length / 3;


                    // Bottom faces

                    for ( let i = 0; i < flen; i ++ ) {

                        const face = faces[ i ];
                        f3( face[ 2 ], face[ 1 ], face[ 0 ] );

                    }

                    // Top faces

                    for ( let i = 0; i < flen; i ++ ) {

                        const face = faces[ i ];
                        f3( face[ 0 ] + vlen * steps, face[ 1 ] + vlen * steps, face[ 2 ] + vlen * steps );

                    }


                scope.addGroup( start, verticesArray.length / 3 - start, 0 );

            }

            // Create faces for the z-sides of the shape

            function buildSideFaces() {

                const start = verticesArray.length / 3;
                let layeroffset = 0;
                sidewalls( contour, layeroffset );
                layeroffset += contour.length;

                for ( let h = 0, hl = holes.length; h < hl; h ++ ) {

                    const ahole = holes[ h ];
                    sidewalls( ahole, layeroffset );

                    //, true
                    layeroffset += ahole.length;

                }


                scope.addGroup( start, verticesArray.length / 3 - start, 1 );


            }

            function sidewalls( contour, layeroffset ) {

                let i = contour.length;

                while ( -- i >= 0 ) {

                    const j = i;
                    let k = i - 1;
                    if ( k < 0 ) k = contour.length - 1;

                    //console.log('b', i,j, i-1, k,vertices.length);

                    for ( let s = 0, sl = ( steps + 0 ); s < sl; s ++ ) {

                        const slen1 = vlen * s;
                        const slen2 = vlen * ( s + 1 );

                        const a = layeroffset + j + slen1,
                            b = layeroffset + k + slen1,
                            c = layeroffset + k + slen2,
                            d = layeroffset + j + slen2;

                        f4( a, b, c, d );

                    }

                }

            }

            function v( x, y, z ) {

                placeholder.push( x );
                placeholder.push( y );
                placeholder.push( z );

            }


            function f3( a, b, c ) {

                addVertex( a );
                addVertex( b );
                addVertex( c );

                const nextIndex = verticesArray.length / 3;
                const uvs = uvgen.generateTopUV( scope, verticesArray, nextIndex - 3, nextIndex - 2, nextIndex - 1 );

                addUV( uvs[ 0 ] );
                addUV( uvs[ 1 ] );
                addUV( uvs[ 2 ] );

            }

            function f4( a, b, c, d ) {

                addVertex( a );
                addVertex( b );
                addVertex( d );

                addVertex( b );
                addVertex( c );
                addVertex( d );


                const nextIndex = verticesArray.length / 3;
                const uvs = uvgen.generateSideWallUV( scope, verticesArray, nextIndex - 6, nextIndex - 3, nextIndex - 2, nextIndex - 1 );

                addUV( uvs[ 0 ] );
                addUV( uvs[ 1 ] );
                addUV( uvs[ 3 ] );

                addUV( uvs[ 1 ] );
                addUV( uvs[ 2 ] );
                addUV( uvs[ 3 ] );

            }

            function addVertex( index ) {

                verticesArray.push( placeholder[ index * 3 + 0 ] );
                verticesArray.push( placeholder[ index * 3 + 1 ] );
                verticesArray.push( placeholder[ index * 3 + 2 ] );

            }


            function addUV( vector2 ) {

                uvArray.push( vector2.x );
                uvArray.push( vector2.y );

            }

        }

    }

}
const WorldUVGenerator = {

    generateTopUV: function ( geometry, vertices, indexA, indexB, indexC ) {

        const a_x = vertices[ indexA * 3 ];
        const a_y = vertices[ indexA * 3 + 1 ];
        const b_x = vertices[ indexB * 3 ];
        const b_y = vertices[ indexB * 3 + 1 ];
        const c_x = vertices[ indexC * 3 ];
        const c_y = vertices[ indexC * 3 + 1 ];

        return [
            new Vector2( a_x, a_y ),
            new Vector2( b_x, b_y ),
            new Vector2( c_x, c_y )
        ];

    },

    generateSideWallUV: function ( geometry, vertices, indexA, indexB, indexC, indexD ) {

        const a_x = vertices[ indexA * 3 ];
        const a_y = vertices[ indexA * 3 + 1 ];
        const a_z = vertices[ indexA * 3 + 2 ];
        const b_x = vertices[ indexB * 3 ];
        const b_y = vertices[ indexB * 3 + 1 ];
        const b_z = vertices[ indexB * 3 + 2 ];
        const c_x = vertices[ indexC * 3 ];
        const c_y = vertices[ indexC * 3 + 1 ];
        const c_z = vertices[ indexC * 3 + 2 ];
        const d_x = vertices[ indexD * 3 ];
        const d_y = vertices[ indexD * 3 + 1 ];
        const d_z = vertices[ indexD * 3 + 2 ];


        if ( Math.abs( a_y - b_y ) < Math.abs( a_x - b_x ) ) {

            return [
                new Vector2( a_x, 1 - a_z ),
                new Vector2( b_x, 1 - b_z ),
                new Vector2( c_x, 1 - c_z ),
                new Vector2( d_x, 1 - d_z )
            ];

        } else {

            return [
                new Vector2( a_y, 1 - a_z ),
                new Vector2( b_y, 1 - b_z ),
                new Vector2( c_y, 1 - c_z ),
                new Vector2( d_y, 1 - d_z )
            ];

        }

    }

};
