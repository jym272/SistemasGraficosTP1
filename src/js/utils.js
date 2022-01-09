'use strict';
import * as dat from 'dat.gui';
import {vec3} from "gl-matrix";

// A set of utility functions for /common operations across our application
export const utils = {
    // Find and return a DOM element given an ID
    getCanvas(id) {
        const canvas = document.getElementById(id);

        if (!canvas) {
            console.error(`There is no canvas with id ${id} on this page.`);
            return null;
        }

        return canvas;
    },
    // Given a canvas element, return the WebGL2 context
    getGLContext(canvas) {
        return canvas.getContext('webgl2') || console.error('WebGL2 is not available in your browser.');
    },
    // Given a canvas element, expand it to the size of the window
    // and ensure that it automatically resizes as the window changes
    autoResizeCanvas(canvas) {
        const expandFullScreen = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        expandFullScreen();
        // Resize screen when the browser has triggered the resize event
        window.addEventListener('resize', expandFullScreen);
    },
    // Given a WebGL context and an id for a shader script,
    // return a compiled shader
    getShader(gl, id) {
        const script = document.getElementById(id);
        if (!script) {
            return null;
        }

        const shaderString = script.text.trim();

        let shader;
        if (script.type === 'x-shader/x-vertex') {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else if (script.type === 'x-shader/x-fragment') {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, shaderString);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    },
    // Normalize colors from 0-255 to 0-1
    normalizeColor(color) {
        return color.map(c => c / 255);
    },
    // De-normalize colors from 0-1 to 0-255
    denormalizeColor(color) {
        return color.map(c => c * 255);
    },
    // A simpler API on top of the dat.GUI API, specifically
    // designed for this book for a simpler codebase
    configureControls(settings, options = {width: 300}) {

        // Check if a gui instance is passed in or create one by default
        const gui = options.gui || new dat.GUI(options);
        const state = {};

        const isAction = v => typeof v === 'function';

        const isFolder = v =>
            !isAction(v) &&
            typeof v === 'object' &&
            (v.value === null || v.value === undefined);

        const isColor = v =>
            (typeof v === 'string' && ~v.indexOf('#')) ||
            (Array.isArray(v) && v.length >= 3);

        Object.keys(settings).forEach(key => {
            const settingValue = settings[key];

            if (isAction(settingValue)) {
                state[key] = settingValue;
                return gui.add(state, key);
            }
            if (isFolder(settingValue)) {
                // If it's a folder, recursively call with folder as root settings element
                return utils.configureControls(settingValue, {gui: gui.addFolder(key)});
            }

            const {
                value,
                min,
                max,
                step,
                options,
                onChange = () => null,
            } = settingValue;

            // set state
            state[key] = value;

            let controller;

            // There are many other values we can set on top of the dat.GUI
            // API
            if (options) {
                controller = gui.add(state, key, options);
            } else if (isColor(value)) {
                controller = gui.addColor(state, key)
            } else {
                controller = gui.add(state, key, min, max, step)
            }

            controller.onChange(v => onChange(v, state))
        });
        return gui;
    },
    restarVectores(pt1, pt2) {

        const resultado = [];
        for (let i = 0; i < pt1.length; i++) {
            resultado.push(pt1[i] - pt2[i]);
        }

        return resultado
    },
    normalizarVector(unVector) {

        const resultado = [];
        let suma = 0;
        for (let i = 0; i < unVector.length; i++) {
            suma += unVector[i] * unVector[i];
        }
        suma = Math.sqrt(suma);
        for (let i = 0; i < unVector.length; i++) {

            const val = (suma === 0) ? 0 : unVector[i] / suma;
            resultado.push(val);
        }
        return resultado;
    },
    calcularNormales(puntosTangentes) {

        const normales = []
        for (let i = 0; i < puntosTangentes.length; i++) {
            const tangente = puntosTangentes[i]
            normales.push([tangente[1], -tangente[0]])
        }

        return normales;
    },
    pasarTanAVector3(tangentes) {
        const resultado = [];
        for (let i = 0; i < tangentes.length; i++) {
            resultado.push([0, tangentes[i][1], tangentes[i][0]]);
        }
        return resultado;
    },
    productoCruz(v1, v2) {

        const resultado = [];
        resultado[0] = v1[1] * v2[2] - v1[2] * v2[1];
        resultado[1] = v1[2] * v2[0] - v1[0] * v2[2];
        resultado[2] = v1[0] * v2[1] - v1[1] * v2[0];
        return resultado;
    },
    calcularVectorBinormal(vectorNormal, arrayDeTangentes) {

        const vectorBinormal = []
        for (let i = 0; i < arrayDeTangentes.length; i++) {
            const tangente = arrayDeTangentes[i]
            const binormal = this.productoCruz(tangente, vectorNormal)
            vectorBinormal.push(utils.normalizarVector(binormal))
        }
        return vectorBinormal
    },
    deRadianesAGrados(anguloRad) {
        return (anguloRad * 180 / Math.PI > 360) ? anguloRad * 180 / Math.PI - 360 : anguloRad * 180 / Math.PI;

    },
    crearForma(divisiones, formaSuperficie) {

        const {puntos, puntosTangentes} = formaSuperficie.extraerPuntos(divisiones)
        const normales = utils.calcularNormales(puntosTangentes)

        if (puntos.length !== normales.length) {
            console.error("Se agrega la normal [1,0] al pt:", puntos[puntos.length - 1])
            normales.push([1, 0])  //la ultima tangente/normal a mano

        }
        return {
            puntos,
            normales,
            tangentes: puntosTangentes,
        };
    },
    crearRecorrido(pasoDiscreto, curvaRecorrido, normalDelCamino = [1, 0, 0]) {

        const {puntos, puntosTangentes} = curvaRecorrido.extraerPuntos(pasoDiscreto)
        // console.log(puntos, tangentes)
        const arrayDeTangentes = utils.pasarTanAVector3(puntosTangentes)

        const vectorNormal = normalDelCamino
        const arrayDeBinormales = utils.calcularVectorBinormal(vectorNormal, arrayDeTangentes)


        //comparar la longitud de puntos, tangentes, y binormales, y si son distintos devolver error
        if (puntos.length !== puntosTangentes.length || puntosTangentes.length !== arrayDeBinormales.length) {
            console.error("No coinciden puntos, tangentes y binormales", puntos.length, puntosTangentes.length, arrayDeBinormales.length)
        }

        return {
            puntos,
            tangentes: arrayDeTangentes,
            binormales: arrayDeBinormales,
            vectorNormal
        }
    },
    crearRecorridoCircular(radio, porcion, divisiones) {

        const phi = 2 * Math.PI * porcion

        const arrayCoordenadas = []
        const arrayNormales = []
        const arrayTangentes = []
        for (let i = 0; i <= divisiones; i++) {
            const angulo = phi * i / divisiones

            const x = radio * Math.cos(angulo)
            const y = radio * Math.sin(angulo)
            //y las normales son
            const nx = Math.cos(angulo)
            const ny = Math.sin(angulo)
            //y las tangentes son
            const tx = -Math.sin(angulo)
            const ty = Math.cos(angulo)

            arrayCoordenadas.push([x, y])
            arrayNormales.push([nx, ny, 0])
            arrayTangentes.push([tx, ty, 0])

        }
        const normal = [0, 0, 1] //normal de la curva es el eje z,

        return {
            puntos: arrayCoordenadas,
            tangentes: arrayTangentes,
            binormales: arrayNormales,
            vectorNormal: normal
        };
    },
    nuevasCoordenadas(matrizDeTransformacion, superficie, unshift = false) {

        const vertices = superficie.vertices
        const normales = superficie.normales
        const tangentes = superficie.tangentes
        const newVertices = []
        const newNormales = []
        const newTangentes = []
        let i = 0, f = 3;

        (vertices.length !== normales.length) ? console.log('Vertices y normales distinta longitud') : null;
        while (f <= vertices.length) {

            const new_vertex = vec3.fromValues(...vertices.slice(i, f));
            const new_normal = vec3.fromValues(...normales.slice(i, f));
            const new_tangente = vec3.fromValues(...tangentes.slice(i, f));

            vec3.transformMat4(new_normal, new_normal, matrizDeTransformacion);
            vec3.transformMat4(new_vertex, new_vertex, matrizDeTransformacion);
            vec3.transformMat4(new_tangente, new_tangente, matrizDeTransformacion);

            (unshift) ? newVertices.unshift(...new_vertex) : newVertices.push(...new_vertex);

            vec3.normalize(new_normal, new_normal);
            (unshift) ? newNormales.unshift(...new_normal) : newNormales.push(...new_normal);

            vec3.normalize(new_tangente, new_tangente);
            (unshift) ? newTangentes.unshift(...new_tangente) : newTangentes.push(...new_tangente);

            i += 3
            f += 3
        }
        (newVertices.length !== newNormales.length) ? console.log('Vertices y normales nuevas distinta longitud') : null;
        (vertices.length !== newVertices.length) ? console.log('Vertices transformados no coinciden en longitud') : null;
        (normales.length !== newNormales.length) ? console.log('Normales transformadas no coinciden en longitud') : null;
        return {
            vertices: newVertices,
            normales: newNormales,
            tangentes: newTangentes

        }
    },
    I3(vector, msg, fixed = 3) {

        (msg) ? console.log(msg) : null;
        for (let i = 0; i < vector.length; i = i + 3) {
            //print with fixed 2 decimals
            console.log(vector[i].toFixed(fixed) + " " + vector[i + 1].toFixed(fixed)
                + " " + vector[i + 2].toFixed(fixed)
            );
        }
    },
    arrayDeVectores(streamDePuntos, dimension) {
        const arrayDeVectores = []
        for (let i = 0; i < streamDePuntos.length; i = i + dimension) {
            arrayDeVectores.push([...streamDePuntos.slice(i, i + dimension)])
        }
        return arrayDeVectores
    },
    I2(vector, msg) {

        const columna1 = [];
        const columna2 = [];
        (msg && msg !== "noImprimir") ? console.log(msg) : null;
        for (let i = 0; i < vector.length; i = i + 2) {
            //print with fixed 2 decimals
            columna1.push(vector[i]);
            columna2.push(vector[i + 1]);
            (msg !== "noImprimir") ?
                console.log(vector[i].toFixed(4) + " " + vector[i + 1].toFixed(4)) : null;
        }
        return {
            columna1,
            columna2
        }
    },
    calcularTanYBiTan(superficie) {
        const {vertices, indices, textureCoords, normales} = superficie

        const verticesArray = utils.arrayDeVectores(vertices, 3)
        const textureCoordsArray = utils.arrayDeVectores(textureCoords, 2)
        const normalesArray = utils.arrayDeVectores(normales, 3)

        const tangentes = []
        const bitangentes = []


        for (let i = 0; i < verticesArray.length; i++) {
            tangentes[i] = [0, 0, 0];
            bitangentes[i] = [0, 0, 0];
        }

        const tan = {
            x: 0,
            y: 0,
            z: 0
        }
        const bitan = {
            x: 0,
            y: 0,
            z: 0
        }
        let f_value = 0; //se usa en el caso de que f sea infinito
        let seAsignof = false;
        for (let i = 0; i < indices.length - 2; i++) {
            const indice1 = indices[i]
            const indice2 = indices[i + 1]
            const indice3 = indices[i + 2]

            const v1 = verticesArray[indice1]
            const v2 = verticesArray[indice2]
            const v3 = verticesArray[indice3]


            const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]]
            const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]]

            const t1 = textureCoordsArray[indice1]
            const t2 = textureCoordsArray[indice2]
            const t3 = textureCoordsArray[indice3]

            const deltaU1 = t2[0] - t1[0]
            const deltaV1 = t2[1] - t1[1]

            const deltaU2 = t3[0] - t1[0]
            const deltaV2 = t3[1] - t1[1]

            let f = 1 / ((deltaU1 * deltaV2) - (deltaU2 * deltaV1));
            if (!seAsignof && f !== Infinity && f !== -Infinity && f !== 0) {
                f_value = Math.abs(f);
                seAsignof = true;
            }
            (f === Infinity) ? f = f_value : null;
            (f === -Infinity) ? f = -f_value : null;


            tan.x = f * ((deltaV2 * edge1[0]) - (deltaV1 * edge2[0]))
            tan.y = f * ((deltaV2 * edge1[1]) - (deltaV1 * edge2[1]))
            tan.z = f * ((deltaV2 * edge1[2]) - (deltaV1 * edge2[2]))

            bitan.x = f * ((deltaU1 * edge2[0]) - (deltaU2 * edge1[0]))
            bitan.y = f * ((deltaU1 * edge2[1]) - (deltaU2 * edge1[1]))
            bitan.z = f * ((deltaU1 * edge2[2]) - (deltaU2 * edge1[2]))

            const tanAnterior1 = tangentes[indice1]
            const tanAnterior2 = tangentes[indice2]
            const tanAnterior3 = tangentes[indice3]

            const bitanAnterior1 = bitangentes[indice1]
            const bitanAnterior2 = bitangentes[indice2]
            const bitanAnterior3 = bitangentes[indice3]

            tangentes[indice1] = [tanAnterior1[0] + tan.x, tanAnterior1[1] + tan.y, tanAnterior1[2] + tan.z]
            tangentes[indice2] = [tanAnterior2[0] + tan.x, tanAnterior2[1] + tan.y, tanAnterior2[2] + tan.z]
            tangentes[indice3] = [tanAnterior3[0] + tan.x, tanAnterior3[1] + tan.y, tanAnterior3[2] + tan.z]

            bitangentes[indice1] = [bitanAnterior1[0] + bitan.x, bitanAnterior1[1] + bitan.y, bitanAnterior1[2] + bitan.z]
            bitangentes[indice2] = [bitanAnterior2[0] + bitan.x, bitanAnterior2[1] + bitan.y, bitanAnterior2[2] + bitan.z]
            bitangentes[indice3] = [bitanAnterior3[0] + bitan.x, bitanAnterior3[1] + bitan.y, bitanAnterior3[2] + bitan.z]
        }
        //// Orthonormalize each tangent and calculate the handedness.
        const TAN = []
        const BITAN = []
        let posCounter = 0
        let negCounter = 0

        for (let i = 0; i < verticesArray.length; i++) {
            let t = tangentes[i];
            const b = bitangentes[i];
            const n = normalesArray[i];
            const sign = (utils.Dot(utils.Cross(t, b), n) > 0.0) ? 1.0 : -1.0;
            if (sign < 0) {
                t = utils.MultiplyVector(t, -1) //actualizo el signo de las tangentes
                negCounter++;
            }
            else
                posCounter++;

            TAN.push(...utils.normalizarVector(t))
            BITAN.push(...utils.normalizarVector(b))

        }
        // console.log(posCounter,negCounter)
        return {
            tangentes: TAN,
            bitangentes: BITAN
        }
    },
    Dot(a,b){
        return (a[0]*b[0] + a[1]*b[1] + a[2]*b[2]);
    },
    Reject(a, b) { //b por ahora es una normal, su dot no puede ser cero
        // a - b * [Dot(a, b) / Dot(b, b)];
        let factor = (utils.Dot(a,b) / utils.Dot(b,b));
        return [
            a[0] - b[0]* factor,
            a[1] - b[1]* factor,
            a[2] - b[2]* factor
        ]
    },
    Cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ]
    },
    MultiplyVector(vector, a){
        return [
            vector[0] * a,
            vector[1] * a,
            vector[2] * a
        ]
    },
    crearVectorEntre(limiteSuperior, limiteInferior, n){
        const div = (limiteSuperior - limiteInferior)/(n-1)
        const vector = []
        for (let i = 0; i<= n-1; i++){
            vector.push(limiteInferior + i*div)
        }
        return vector
    }
};


	