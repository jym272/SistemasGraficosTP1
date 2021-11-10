
'use strict';
import {utils} from './utils';

function CubicBezierP0(t, p ) {

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
export class CurvaCubicaDeBezier{

    constructor( v0 = [0,0], v1 = [0,0], v2 = [0,0], v3 = [0,0] ) {

        this.type = 'CurvaDeBezier';
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;

    }

    getPoints( divisions = 5 ) {

        const puntos = [];
        const tangentes = [];

        for ( let d = 0; d <= divisions; d ++ ) {

            puntos.push( this.getPoint( d / divisions ) );
            tangentes.push( this.getTangent( d / divisions ) );

        }

        return {
            puntos,
            tangentes
        };

    }

    getPoint( t, optionalTarget = [0,0]) {

        const point = optionalTarget;

        const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

        point[0] = CubicBezier( t, v0[0], v1[0], v2[0], v3[0] )
        point[1] = CubicBezier( t, v0[1], v1[1], v2[1], v3[1] )
        return point;

    }

    getTangent( t) {
        const delta = 0.0001;
        let t1 = t - delta;
        let t2 = t + delta;

        if ( t1 < 0 ) t1 = 0;
        if ( t2 > 1 ) t2 = 1;

        const pt1 = this.getPoint( t1 );
        const pt2 = this.getPoint( t2 );

        const tangent = utils.restarVectores( pt2, pt1 );

        return utils.normalizarVector( tangent );

    }

}


/*
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



 */