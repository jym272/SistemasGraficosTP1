'use strict';
import * as dat from 'dat.gui';

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
            resultado.push(unVector[i] / suma);
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
            normales
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


};


	