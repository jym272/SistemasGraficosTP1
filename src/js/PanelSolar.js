'use strict';

import {utils} from "./utils";
import {colores} from "./colores";
import {Plano, Superficie, Tapa, Tubo} from "./Superficies";
import {dimensiones} from "./dimensiones";
import {mat4} from "gl-matrix";

const dimensionesTriangulosPlano = {
    filas: 36,
    columnas: 8,
}

const dimensionesPanelSolarLadoLargo = {
    ancho: 0.1,
    largo: 6,
}
const dimensionesTriangulosLadoA = {
    filas: 8,
    columnas: 1,
}
const dimensionesTriangulosLadoB = {
    filas: 36,
    columnas: 1,
}

const dimensionesTriangulosTubo = {
    filas: 20,
    columnas: 10,
}

const dimensionesTriangulosTapa = dimensionesTriangulosTubo

export class AnimacionPanelesSolares {
    constructor(velocidadMediaDeGiro = 300, intervaloEnGrados) {
        this.velocidadMediaDeGiro = velocidadMediaDeGiro;
        this.anguloEnProceso = -5; //valor imposible para el comienzo
        this.anguloActual = 0;
        this.intervaloEnGrados = intervaloEnGrados;
        this.timeOutIdPool = [];
        this._GIRO = {
            LINEAL: 1,
            LOG: 0,
        };
        this.MODO_GIRO = this._GIRO.LINEAL;
    }

    empezarEn(anguloRad, panelSolar) {
        this.panelSolar = panelSolar;
        const anguloEntero = Math.floor(utils.deRadianesAGrados(anguloRad))
        //debido a que el angulo se repite varias veces solo animo la primera vez que aparece
        if (anguloEntero % this.intervaloEnGrados === 0 && anguloEntero !== this.anguloEnProceso) {
            this.anguloEnProceso = anguloEntero;
            this.calcularParametrosYAnimar();
        }

    }

    dameUnaVelocidadDeGiroRandom() {
        return Math.floor(this.velocidadMediaDeGiro * (0.5 + Math.random()))
    }

    dameUnNuevoAngulo() {
        //intervalo random en el cual se movera el angulo
        const INTERVALO_RANDOM_A = Math.random()
        const INTERVALO_RANDOM_B = Math.random()

        //seleccionar uno de los dos intervalos al azar
        let nuevoAngulo = (Math.random() < 0.5) ?
            this.panelSolar.anguloRotacion * (1 - INTERVALO_RANDOM_A) :
            this.panelSolar.anguloRotacion * (1 + INTERVALO_RANDOM_B)

        //quedarme solo con la parte entera de intervaloFinal
        nuevoAngulo = Math.floor((nuevoAngulo > 360) ?
            nuevoAngulo % 360 :
            nuevoAngulo)

        //si el nuevo angulo es pequenio -> signifa un giro alrededor de un angulo
        //muy pequeño, y la tendencia es rodear la media -> alargo el angulo
        if (nuevoAngulo < 18) {
            nuevoAngulo = nuevoAngulo * 10 + 1
        }
        return nuevoAngulo
    }

    elegirUnGiro(probabilidadGiroLineal) {
        if (Math.random() < probabilidadGiroLineal)
            this.MODO_GIRO = this._GIRO.LINEAL;
        else
            this.MODO_GIRO = this._GIRO.LOG;
    }

    calcularParametrosYAnimar() {

        const velocidadDeGiro = this.dameUnaVelocidadDeGiroRandom()
        const nuevoAngulo = this.dameUnNuevoAngulo()
        this.anguloActual = nuevoAngulo;

        this.elegirUnGiro(0.6)

        this.cambiarElAnguloRotacionPanelSolar(nuevoAngulo, velocidadDeGiro)
        //para girar a velocidad constante le resto la velocidad en cada llamado-> se acerca mas al angulo final
        //para velocidad logaritminca es otro caso, no se acerca nunca al nuevo angulo por definicion de logaritmo
        //creo un tipo de velocidad, lineal o logaritmico

    }

    cambiarElAnguloRotacionPanelSolar(nuevoAngulo, velocidadDeGiro) {

        // console.log(velocidadDeGiro)
        const anguloEnProceso = this.anguloActual
        const intervalo = this.panelSolar.anguloRotacion - nuevoAngulo;

        let diffAngular;

        if (velocidadDeGiro !== 0) {
            diffAngular = intervalo / velocidadDeGiro
            // console.log("la diff angular:", diffAngular)
            if (Math.abs(diffAngular) > 0.02) {
                this.panelSolar.anguloRotacion -= diffAngular;

                if (anguloEnProceso === nuevoAngulo) {

                    this.timeOutIdPool.push(setTimeout(() => {
                        // console.log("nuevo", nuevoAngulo, this.panelSolar.anguloRotacion)
                        this.cambiarElAnguloRotacionPanelSolar(nuevoAngulo, velocidadDeGiro - this.MODO_GIRO);

                    }, 10));
                } else {
                    //Me llego un nuevo angulo, y no he terminado todos los calls
                    //util especialmente en modo logaritmico y en intervalos muy pequeños
                    this.limpiarElPool();
                    this.anguloActual = nuevoAngulo
                    this.cambiarElAnguloRotacionPanelSolar(nuevoAngulo, velocidadDeGiro - this.MODO_GIRO);
                }
            } else {
                //me acerque lo suficiente en modo logaritmico
                this.limpiarElPool();
            }
        } else {
            // Solo en modo lineal, me acero exactamente al nuevo angulo
            this.limpiarElPool();
        }

        // console.log(diffAngular)


    }

    limpiarElPool() {
        this.timeOutIdPool.forEach(id => clearTimeout(id));
        this.timeOutIdPool = [];
    }

}


export class PanelSolar {
    constructor(scene) {

        this.scene = scene;
        this.panelesEnEscena = []
        this.cantidadDeFilas = 4;
        this.cambiarAlturaDelTuboPrincipal();
        this.construirPanelSolar()
    }
    construirPanelSolar() {

        const panelSolar = new Superficie(null, 'panelSolar');

        const tapaSuperior = new Plano('tapaSuperior', dimensiones.panelSolar.tapa, dimensionesTriangulosPlano);
        const ladoA = new Plano('LadoA', dimensiones.panelSolar.lado, dimensionesTriangulosLadoA);
        const ladoB = new Plano('LadoB', dimensionesPanelSolarLadoLargo, dimensionesTriangulosLadoB);
        const ladoA1 = new Plano('LadoA1', dimensiones.panelSolar.lado, dimensionesTriangulosLadoA);
        const ladoB1 = new Plano('LadoB1', dimensionesPanelSolarLadoLargo, dimensionesTriangulosLadoB);
        const tapaInferior = new Plano('tapaInferior', dimensiones.panelSolar.tapa, dimensionesTriangulosPlano);

        //Transformaciones
        //->tapa Superior
        const tapaSuperiorTransform = mat4.identity(mat4.create());
        mat4.translate(tapaSuperiorTransform, tapaSuperiorTransform, [0, dimensiones.panelSolar.lado.ancho, 0]);

        const nuevasTanBitTapaSuperior = utils.calcularTanYBiTan(tapaSuperior)
        tapaSuperior.tangentes = nuevasTanBitTapaSuperior.tangentes

        const tapaSuperior_NEW = utils.nuevasCoordenadas(tapaSuperiorTransform, tapaSuperior, false)
        tapaSuperior_NEW.normales = tapaSuperior.normales
        tapaSuperior_NEW.tangentes = tapaSuperior.tangentes

        //tapa inferior
        const tapaInferiorTransform = mat4.identity(mat4.create());
        mat4.rotate(tapaInferiorTransform, tapaInferiorTransform, Math.PI, [1, 0, 0]);

        const nuevasTanBitTapaInferior = utils.calcularTanYBiTan(tapaInferior)
        tapaInferior.tangentes = nuevasTanBitTapaInferior.tangentes

        const tapaInferior_NEW = utils.nuevasCoordenadas(tapaInferiorTransform, tapaInferior, false)

        //lado A
        const ladoATyN = mat4.identity(mat4.create());
        mat4.rotate(ladoATyN, ladoATyN, Math.PI / 2, [0, 0, 1]);
        mat4.rotate(ladoATyN, ladoATyN, Math.PI, [0, 1, 1]);

        const ladoATransform = mat4.identity(mat4.create());
        mat4.translate(ladoATransform, ladoATransform, [0, dimensiones.panelSolar.lado.ancho / 2, dimensiones.panelSolar.tapa.largo / 2]);
        mat4.multiply(ladoATransform, ladoATransform, ladoATyN);

        const nuevasTanBitLadoA = utils.calcularTanYBiTan(ladoA)
        ladoA.tangentes = nuevasTanBitLadoA.tangentes

        const ladoA_NEW_AUX = utils.nuevasCoordenadas(ladoATyN, ladoA, false)
        const ladoA_NEW = utils.nuevasCoordenadas(ladoATransform, ladoA, false)
        ladoA_NEW.normales = ladoA_NEW_AUX.normales
        ladoA_NEW.tangentes = ladoA_NEW_AUX.tangentes

        //lado B
        const ladoBTyN = mat4.identity(mat4.create());
        mat4.rotate(ladoBTyN, ladoBTyN, Math.PI, [1, 1, 0]);

        const ladoBTransform = mat4.identity(mat4.create());
        mat4.translate(ladoBTransform, ladoBTransform, [dimensiones.panelSolar.lado.largo / 2, dimensiones.panelSolar.lado.ancho / 2, 0]);
        mat4.multiply(ladoBTransform, ladoBTransform, ladoBTyN);

        const nuevasTanBitLadoB = utils.calcularTanYBiTan(ladoB)
        ladoB.tangentes = nuevasTanBitLadoB.tangentes

        const ladoB_NEW_AUX = utils.nuevasCoordenadas(ladoBTyN, ladoB, false)
        const ladoB_NEW = utils.nuevasCoordenadas(ladoBTransform, ladoB, false)
        ladoB_NEW.normales = ladoB_NEW_AUX.normales
        ladoB_NEW.tangentes = ladoB_NEW_AUX.tangentes

        //lado A1
        const ladoA1TyN = mat4.identity(mat4.create());
        mat4.rotate(ladoA1TyN, ladoA1TyN, Math.PI / 2, [1, 0, 0]);
        mat4.rotate(ladoA1TyN, ladoA1TyN, -Math.PI, [1, 0, 1]);

        const ladoA1Transform = mat4.identity(mat4.create());
        mat4.translate(ladoA1Transform, ladoA1Transform, [0, dimensiones.panelSolar.lado.ancho / 2, -dimensiones.panelSolar.tapa.largo / 2]);

        mat4.multiply(ladoA1Transform, ladoA1Transform, ladoA1TyN);

        const nuevasTanBitLadoA1 = utils.calcularTanYBiTan(ladoA1)
        ladoA1.tangentes = nuevasTanBitLadoA1.tangentes

        const ladoA1_NEW_AUX = utils.nuevasCoordenadas(ladoA1TyN, ladoA1, false)
        const ladoA1_NEW = utils.nuevasCoordenadas(ladoA1Transform, ladoA1, false)
        ladoA1_NEW.normales = ladoA1_NEW_AUX.normales
        ladoA1_NEW.tangentes = ladoA1_NEW_AUX.tangentes

        //lado B1
        const ladoB1TyN = mat4.identity(mat4.create());
        mat4.rotate(ladoB1TyN, ladoB1TyN, -Math.PI, [0, 0, 1]);
        mat4.rotate(ladoB1TyN, ladoB1TyN, -Math.PI, [1, 1, 0]);

        const ladoB1Transform = mat4.identity(mat4.create());
        mat4.translate(ladoB1Transform, ladoB1Transform, [-dimensiones.panelSolar.lado.largo / 2, dimensiones.panelSolar.lado.ancho / 2, 0]);
        mat4.multiply(ladoB1Transform, ladoB1Transform, ladoB1TyN);

        const nuevasTanBitLadoB1 = utils.calcularTanYBiTan(ladoB1)
        ladoB1.tangentes = nuevasTanBitLadoB1.tangentes

        const ladoB1_NEW_AUX = utils.nuevasCoordenadas(ladoB1TyN, ladoB1, false)
        const ladoB1_NEW = utils.nuevasCoordenadas(ladoB1Transform, ladoB1, false)
        ladoB1_NEW.normales = ladoB1_NEW_AUX.normales
        ladoB1_NEW.tangentes = ladoB1_NEW_AUX.tangentes


        //Nuevas coordenadas de texturas
        //Tapa Superior 36/8 -> 9/4
        const U_tapaS = utils.crearVectorEntre(4.5, 0, dimensionesTriangulosPlano.filas + 1)
        const V_tapaS = utils.crearVectorEntre(1, 0, dimensionesTriangulosPlano.columnas + 1)

        const UV_tapaS = []

        for (let i = 0; i < U_tapaS.length; i++) {
            for (let j = 0; j < V_tapaS.length; j++) {
                UV_tapaS.push(V_tapaS[j], U_tapaS[i])
            }
        }
        tapaSuperior_NEW.textureCoords = UV_tapaS

        //Lado A
        const U_LadoA = utils.crearVectorEntre(2, 0, dimensionesTriangulosLadoA.filas + 1)
        const V_LadoA = utils.crearVectorEntre(0.5, 0, dimensionesTriangulosLadoA.columnas + 1)

        const UV_LadoA = []

        for (let i = 0; i < U_LadoA.length; i++) {
            for (let j = 0; j < V_LadoA.length; j++) {
                UV_LadoA.push(V_LadoA[j], U_LadoA[i])
            }
        }
        ladoA_NEW.textureCoords = UV_LadoA

        //Lado B
        const U_LadoB = utils.crearVectorEntre(4.5 * 2, 0, dimensionesTriangulosLadoB.filas + 1)
        const V_LadoB = utils.crearVectorEntre(0.5, 0, dimensionesTriangulosLadoB.columnas + 1)

        const UV_LadoB = []

        for (let i = 0; i < U_LadoB.length; i++) {
            for (let j = 0; j < V_LadoB.length; j++) {
                UV_LadoB.push(V_LadoB[j], U_LadoB[i])
            }
        }
        ladoB_NEW.textureCoords = UV_LadoB


        //Calculo de nuevos indices
        const ladoA_NEW_indices = []
        ladoA.indices.forEach(indice => {
            ladoA_NEW_indices.push(indice + tapaSuperior.indices[tapaSuperior.indices.length - 1] + 1);
        });

        const ladoB_NEW_indices = []
        ladoB.indices.forEach(indice => {
            ladoB_NEW_indices.push(indice + ladoA_NEW_indices[ladoA_NEW_indices.length - 1] + 1);
        });

        const ladoA1_NEW_indices = []
        ladoA1.indices.forEach(indice => {
            ladoA1_NEW_indices.push(indice + ladoB_NEW_indices[ladoB_NEW_indices.length - 1] + 1);
        });

        const ladoB1_NEW_indices = []
        ladoB1.indices.forEach(indice => {
            ladoB1_NEW_indices.push(indice + ladoA1_NEW_indices[ladoA1_NEW_indices.length - 1] + 1);
        });

        const tapaInferior_NEW_indices = []
        tapaInferior.indices.forEach(indice => {
            tapaInferior_NEW_indices.push(indice + ladoB1_NEW_indices[ladoB1_NEW_indices.length - 1] + 1);
        });

        //Indices
        panelSolar.indices.push(
            ...tapaSuperior.indices, tapaSuperior.indices[tapaSuperior.indices.length - 1], ladoA_NEW_indices[0],
            ...ladoA_NEW_indices, ladoA_NEW_indices[ladoA_NEW_indices.length - 1], ladoB_NEW_indices[0],
            ...ladoB_NEW_indices, ladoB_NEW_indices[ladoB_NEW_indices.length - 1], ladoA1_NEW_indices[0],
            ...ladoA1_NEW_indices, ladoA1_NEW_indices[ladoA1_NEW_indices.length - 1], ladoB1_NEW_indices[0],
            ...ladoB1_NEW_indices, ladoB1_NEW_indices[ladoB1_NEW_indices.length - 1], tapaInferior_NEW_indices[0],
            ...tapaInferior_NEW_indices,
        )
        //Vertices
        panelSolar.vertices.push(
            ...tapaSuperior_NEW.vertices,
            ...ladoA_NEW.vertices,
            ...ladoB_NEW.vertices,
            ...ladoA1_NEW.vertices,
            ...ladoB1_NEW.vertices,
            ...tapaInferior_NEW.vertices,
        );
        //normales
        panelSolar.normales.push(
            ...tapaSuperior_NEW.normales,
            ...ladoA_NEW.normales,
            ...ladoB_NEW.normales,
            ...ladoA1_NEW.normales,
            ...ladoB1_NEW.normales,
            ...tapaInferior_NEW.normales
        );
        //UV
        panelSolar.textureCoords.push(
            ...tapaSuperior_NEW.textureCoords,
            ...ladoA_NEW.textureCoords,
            ...ladoB_NEW.textureCoords,
            ...ladoA_NEW.textureCoords,
            ...ladoB_NEW.textureCoords,
            ...tapaSuperior_NEW.textureCoords,
        );
        //tangentes
        panelSolar.tangentes.push(
            ...tapaSuperior_NEW.tangentes,
            ...ladoA_NEW.tangentes,
            ...ladoB_NEW.tangentes,
            ...ladoA1_NEW.tangentes,
            ...ladoB1_NEW.tangentes,
            ...tapaInferior_NEW.tangentes
        )

        panelSolar.diffuse = colores.Textura.diffuse
        panelSolar.ambient = colores.Textura.ambient
        panelSolar.texture = "panelSolar";

        this.panelSolar1 = panelSolar;
        this.panelSolar1.alias = "panelSolar1";
        this.panelSolar2 = Object.assign({}, panelSolar);
        this.panelSolar2.alias = "panelSolar2";
    }

    nuevosPanelesEnEscena() {
        this.scene.add(this.panelSolar1)
        this.scene.add(this.panelSolar2)
        this.panelesEnEscena.push(this.panelSolar1, this.panelSolar2)
    }

    removerPanelesSolares() {
        const {scene} = this

        scene.remove('tuboPrincipal');
        scene.remove('tapaPrincipal');

        for (let i = 0; i < this.cantidadDeFilas; i++) {
            scene.remove('tuboSecundario');
            scene.remove('tapaSecundaria1');
            scene.remove('tapaSecundaria2');
            this.removerParPaneles()
        }
    }

    removerParPaneles(unPar = 2) {
        let i = 0
        if (this.panelesEnEscena.length < unPar)
            console.error('No hay mas paneles para remover');
        else {
            while (i < unPar) {
                this.scene.remove(this.panelesEnEscena.pop().alias)
                i++
            }
        }
    }

    cambiarAlturaDelTuboPrincipal() {
        dimensiones.panelSolar.tuboPrincipal.altura = this.cantidadDeFilas
            * dimensiones.panelSolar.distanciaEntreTubosSecundarios
            + 2.15;  //un factor de correcion
    }

    cargarPanelesSolares() {
        const {scene} = this

        scene.add(new Tubo('tuboPrincipal', dimensiones.panelSolar.tuboPrincipal, dimensionesTriangulosTubo))
        scene.add(new Tapa('tapaPrincipal', dimensiones.panelSolar.tuboPrincipal.radio, dimensionesTriangulosTapa))

        for (let i = 0; i < this.cantidadDeFilas; i++) {
            scene.add(new Tubo('tuboSecundario', dimensiones.panelSolar.tuboSecundario, dimensionesTriangulosTubo))
            scene.add(new Tapa('tapaSecundaria1', dimensiones.panelSolar.tuboSecundario.radio, dimensionesTriangulosTapa))
            scene.add(new Tapa('tapaSecundaria2', dimensiones.panelSolar.tuboSecundario.radio, dimensionesTriangulosTapa))
            this.nuevosPanelesEnEscena()
        }
    }
}

