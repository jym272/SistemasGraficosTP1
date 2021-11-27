'use strict';
import {Forma, SuperficieParametrica, TapaSuperficieParametrica} from "./SuperficiesDeBarrido";
import {utils} from "./utils";
import {colores} from "./colores";

export class Bloque {
    constructor(radioDelAnillo, scene, type = Bloque.BLOQUES_8, pasoDiscretoRecorrido = 16, divisionesForma = 8) {

        this.scene = scene
        this.radioDelAnillo = radioDelAnillo;
        this.bloqueActual = null
        this.pasoDiscretoRecorrido = pasoDiscretoRecorrido
        this.divisionesForma = divisionesForma
        this.dictionary = {};
        Bloque.TYPES.forEach(item => {
            this.dictionary[item] = []
        });
        this.construirBloques()
    }

    construirBloques() {
        const {radioDelAnillo} = this
        const pasoDiscretoRecorrido = this.pasoDiscretoRecorrido;
        const divisionesForma = this.divisionesForma //de las curvas de Bezier

        //Forma del frente del bloque
        const formaSuperficie = new Forma();
        //conservar el ingreso de datos, bezier, punto, bezier, punto .... IMPORTANTE PARA LAS NORMALES
        formaSuperficie.iniciarEn(2.2, 0.6)
        formaSuperficie.CurvaBezierA(2.2, 0.8, 2, 1, 1.8, 1)
        formaSuperficie.lineaA(-1.8, 1)
        formaSuperficie.CurvaBezierA(-2, 1, -2.2, 0.8, -2.2, 0.6)
        formaSuperficie.lineaA(-2.2, -0.6)
        formaSuperficie.CurvaBezierA(-2.2, -0.8, -2, -1, -1.8, -1)
        formaSuperficie.lineaA(1.8, -1)
        formaSuperficie.CurvaBezierA(2, -1, 2.2, -0.8, 2.2, -0.6)
        formaSuperficie.lineaA(2.2, 0.6).curvaCerrada(true)  //la ultima tangente/normal a mano->Observar la direccion de la normal


        const datosDeLaForma = utils.crearForma(divisionesForma, formaSuperficie)
        const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
        const dimensiones = {
            filas: pasoDiscretoRecorrido, //paso discreto del recorrido
            columnas: pasoDiscretoForma, //divisiones de la forma
        }

        //Bloque4
        let porcionCircular = 1 / 8
        // dimensiones["filas"] = pasoDiscretoRecorrido -20
        const datosDelRecorridoBloque_4 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular, dimensiones["filas"])

        let i = 4;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_4].push(new SuperficieParametrica("bloque", datosDeLaForma, datosDelRecorridoBloque_4, dimensiones, true))
            this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
                "bloqueTapaAdelante", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
            this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
                "bloqueTapaAtras", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
        }

        //Bloque5
        porcionCircular = 1 / 10
        dimensiones.filas -= 2 //le voy restando filas de triangulos, piezas mas pequeñas
        const datosDelRecorridoBloque_5 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular, dimensiones["filas"])

        i = 5;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_5].push(new SuperficieParametrica("bloque", datosDeLaForma, datosDelRecorridoBloque_5, dimensiones, true))
            this.dictionary[Bloque.BLOQUES_5].push(new TapaSuperficieParametrica(
                "bloqueTapaAdelante", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
            this.dictionary[Bloque.BLOQUES_5].push(new TapaSuperficieParametrica(
                "bloqueTapaAtras", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
        }
        //Bloque6
        porcionCircular = 1 / 12
        dimensiones.filas -= 2
        const datosDelRecorridoBloque_6 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular, dimensiones["filas"])

        i = 6;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_6].push(new SuperficieParametrica("bloque", datosDeLaForma, datosDelRecorridoBloque_6, dimensiones, true))
            this.dictionary[Bloque.BLOQUES_6].push(new TapaSuperficieParametrica(
                "bloqueTapaAdelante", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
            this.dictionary[Bloque.BLOQUES_6].push(new TapaSuperficieParametrica(
                "bloqueTapaAtras", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
        }
        //Bloque7
        porcionCircular = 1 / 14
        dimensiones.filas -= 2
        const datosDelRecorridoBloque_7 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular, dimensiones["filas"])
        i = 7;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_7].push(new SuperficieParametrica("bloque", datosDeLaForma, datosDelRecorridoBloque_7, dimensiones, true))
            this.dictionary[Bloque.BLOQUES_7].push(new TapaSuperficieParametrica(
                "bloqueTapaAdelante", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
            this.dictionary[Bloque.BLOQUES_7].push(new TapaSuperficieParametrica(
                "bloqueTapaAtras", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
        }
        //Bloque8
        porcionCircular = 1 / 16
        dimensiones.filas -= 2
        const datosDelRecorridoBloque_8 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular, dimensiones["filas"])
        i = 8;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_8].push(new SuperficieParametrica("bloque", datosDeLaForma, datosDelRecorridoBloque_8, dimensiones, true))
            this.dictionary[Bloque.BLOQUES_8].push(new TapaSuperficieParametrica(
                "bloqueTapaAdelante", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
            this.dictionary[Bloque.BLOQUES_8].push(new TapaSuperficieParametrica(
                "bloqueTapaAtras", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))
        }

    }

    setType(type) {
        ~Bloque.TYPES.indexOf(type)
            ? this.type = type
            : console.error(`Bloque type (${type}) not supported`);

        this.removerBloqueActualDeLaEscena();
        this.actualizarEscena()
    }

    dameElTipoDeBloqueActual() {
        return this.type;
    }

    removerBloqueActualDeLaEscena() {
        if (this.bloqueActual != null)
            this.bloqueActual.forEach(item => {
                this.scene.remove(item.alias)
            });
    }

    actualizarEscena() {
        this.dictionary[this.type].forEach(item => {
            this.scene.add(item, {
                diffuse: colores.Violeta,
            });
        });
        this.bloqueActual = this.dictionary[this.type]
    }
}

Bloque.TYPES = ['BLOQUES_8', 'BLOQUES_7', 'BLOQUES_6', 'BLOQUES_5', 'BLOQUES_4'];
Bloque.TYPES.forEach(type => Bloque[type] = type)
