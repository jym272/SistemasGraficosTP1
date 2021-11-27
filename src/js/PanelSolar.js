'use strict';

import {utils} from "./utils";
import {colores} from "./colores";
import {Plano, Superficie, Tapa, Tubo} from "./Superficies";
import {dimensiones} from "./dimensiones";

const dimensionesTriangulosPlano = {
    filas: 1,
    columnas: 1,
}

const dimensionesPanelSolarLadoLargo = {
    ancho: 0.1,
    largo: 6,
}

const dimensionesTriangulosTubo = {
    filas: 1,
    columnas: 10,
}

const dimensionesTriangulosTapa = dimensionesTriangulosTubo

export class AnimacionPanelesSolares{
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
    empezarEn(anguloRad, panelSolar){
        this.panelSolar = panelSolar;
        const anguloEntero = Math.floor(utils.deRadianesAGrados(anguloRad))
        //debido a que el angulo se repite varias veces solo animo la primera vez que aparece
        if (anguloEntero % this.intervaloEnGrados === 0 && anguloEntero !== this.anguloEnProceso) {
            this.anguloEnProceso = anguloEntero;
            this.calcularParametrosYAnimar();
        }

    }
    dameUnaVelocidadDeGiroRandom(){
        return Math.floor(this.velocidadMediaDeGiro*(0.5 + Math.random()))
    }
    dameUnNuevoAngulo(){
        //intervalo random en el cual se movera el angulo
        const INTERVALO_RANDOM_A = Math.random()
        const INTERVALO_RANDOM_B = Math.random()

        //seleccionar uno de los dos intervalos al azar
        let nuevoAngulo = (Math.random() < 0.5) ?
            this.panelSolar.anguloRotacion * (1 - INTERVALO_RANDOM_A) :
            this.panelSolar.anguloRotacion * (1 + INTERVALO_RANDOM_B)

        //quedarme solo con la parte entera de intervaloFinal
        nuevoAngulo = Math.floor( (nuevoAngulo > 360) ?
            nuevoAngulo % 360 :
            nuevoAngulo )

        //si el nuevo angulo es pequenio -> signifa un giro alrededor de un angulo
        //muy pequeño, y la tendencia es rodear la media -> alargo el angulo
        if(nuevoAngulo < 18){
            nuevoAngulo = nuevoAngulo * 10 + 1
        }
        return nuevoAngulo
    }
    elegirUnGiro(probabilidadGiroLineal){
        if(Math.random() < probabilidadGiroLineal)
            this.MODO_GIRO = this._GIRO.LINEAL;
        else
            this.MODO_GIRO = this._GIRO.LOG;
    }
    calcularParametrosYAnimar(){

        const velocidadDeGiro = this.dameUnaVelocidadDeGiroRandom()
        const nuevoAngulo = this.dameUnNuevoAngulo()
        this.anguloActual = nuevoAngulo;

        this.elegirUnGiro(0.6)

        this.cambiarElAnguloRotacionPanelSolar(nuevoAngulo, velocidadDeGiro)
        //para girar a velocidad constante le resto la velocidad en cada llamado-> se acerca mas al angulo final
        //para velocidad logaritminca es otro caso, no se acerca nunca al nuevo angulo por definicion de logaritmo
        //creo un tipo de velocidad, lineal o logaritmico

    }
    cambiarElAnguloRotacionPanelSolar(nuevoAngulo, velocidadDeGiro){

        // console.log(velocidadDeGiro)
        const anguloEnProceso = this.anguloActual
        const intervalo= this.panelSolar.anguloRotacion - nuevoAngulo;

        let diffAngular;

        if(velocidadDeGiro !== 0 ){
            diffAngular = intervalo / velocidadDeGiro
            // console.log("la diff angular:", diffAngular)
            if(Math.abs(diffAngular) > 0.02) {
                this.panelSolar.anguloRotacion -= diffAngular;

                if (anguloEnProceso === nuevoAngulo) {

                    this.timeOutIdPool.push(setTimeout(() => {
                        // console.log("nuevo", nuevoAngulo, this.panelSolar.anguloRotacion)
                        this.cambiarElAnguloRotacionPanelSolar(nuevoAngulo, velocidadDeGiro - this.MODO_GIRO);

                    }, 10));
                }
                else {
                    //Me llego un nuevo angulo, y no he terminado todos los calls
                    //util especialmente en modo logaritmico y en intervalos muy pequeños
                    this.limpiarElPool();
                    this.anguloActual = nuevoAngulo
                    this.cambiarElAnguloRotacionPanelSolar(nuevoAngulo, velocidadDeGiro - this.MODO_GIRO);
                }
            }else{
                //me acerque lo suficiente en modo logaritmico
                this.limpiarElPool();
            }
        }else{
            // Solo en modo lineal, me acero exactamente al nuevo angulo
            this.limpiarElPool();
        }

        // console.log(diffAngular)


    }
    limpiarElPool(){
        this.timeOutIdPool.forEach(id => clearTimeout(id));
        this.timeOutIdPool= [];
    }

}


export class PanelSolar {
    constructor(scene) {

        this.scene = scene;
        this.panelesEnEscena = []
        this.cantidadDeFilas = 4;
        this.construirComponentes()
    }

    construirComponentes() {
        this.componentes = []
        /*
         * Construccion del panelSolar
         */

        const tapaSuperior = new Plano('panelTapaSuperior', dimensiones.panelSolar.tapa, dimensionesTriangulosPlano)
        tapaSuperior.diffuse = colores.PanelSolar;
        this.componentes.push(tapaSuperior)

        const tapaInferior = new Plano('panelTapaInferior', dimensiones.panelSolar.tapa, dimensionesTriangulosPlano)
        tapaInferior.diffuse = colores.PanelSolar;

        this.componentes.push(tapaInferior)

        this.componentes.push(new Plano('panelLadoA', dimensiones.panelSolar.lado, dimensionesTriangulosPlano))

        this.componentes.push(new Plano('panelLadoA1', dimensiones.panelSolar.lado, dimensionesTriangulosPlano))

        this.componentes.push(new Plano('panelLadoB', dimensionesPanelSolarLadoLargo, dimensionesTriangulosPlano))

        this.componentes.push(new Plano('panelLadoB1', dimensionesPanelSolarLadoLargo, dimensionesTriangulosPlano))

        this.cambiarAlturaDelTuboPrincipal();
    }

    nuevo(alias) {
        const nuevoPanel = []
        /*
         * Abstraccion del panelSolar
         */
        nuevoPanel.push(new Superficie(null, alias))
        nuevoPanel.push(...this.componentes)
        this.agregarALaEscena(nuevoPanel)
        this.panelesEnEscena.push(nuevoPanel)
    }

    agregarALaEscena(nuevoPanel) {
        nuevoPanel.forEach(componente => {
            this.scene.add(componente)
        })
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
                this.panelesEnEscena.pop().forEach(componente => {
                    this.scene.remove(componente.alias)
                })
                i++
            }
        }
    }

    cambiarAlturaDelTuboPrincipal(){
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

            this.nuevo('panelSolar1')
            this.nuevo('panelSolar2')
        }
    }




}

