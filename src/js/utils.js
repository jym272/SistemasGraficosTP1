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
    I3(vector, msg) {

        (msg) ? console.log(msg) : null;
        for (let i = 0; i < vector.length; i = i + 3) {
            //print with fixed 2 decimals
            console.log(vector[i].toFixed(4) + " " + vector[i + 1].toFixed(4)
                + " " + vector[i + 2].toFixed(4)
            );
        }
    },
    arrayDeVectores(streamDePuntos, dimension){
        const arrayDeVectores = []
        for(let i=0; i<streamDePuntos.length; i = i + dimension){
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
            console.log(vector[i].toFixed(4) + " " + vector[i + 1].toFixed(4)) :null;
        }
        return {
            columna1,
            columna2
        }
    },
};


	