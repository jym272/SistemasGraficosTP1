'use strict';
import {Forma, SuperficieParametrica1, TapaSuperficieParametrica} from "./SuperficiesDeBarrido";
import {utils} from "./utils";
import {mat4} from "gl-matrix";
import {Superficie} from "./Superficies";
import {colores} from "./colores";

export class Bloque {
    constructor(radioDelAnillo, scene, type = Bloque.BLOQUES_8,
                pasoDiscretoRecorrido = 16, divisionesForma = 8) {

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

    obtenerNuevasCoordenadasTapaAtras(angulo, TapaAtras){
        //Bloque6 tapa de atras
        const transformacionNormalTangentes = mat4.identity(mat4.create());
        mat4.rotate(transformacionNormalTangentes, transformacionNormalTangentes, angulo, [0, 0, 1]);
        mat4.rotate(transformacionNormalTangentes, transformacionNormalTangentes, Math.PI / 2, [0, 1, 0]);

        const transformacion = mat4.identity(mat4.create());
        mat4.translate(transformacion, transformacion, [15.2 * Math.cos(angulo), 15.2 * Math.sin(angulo), 0]);
        mat4.multiply(transformacion, transformacion, transformacionNormalTangentes);


        const coordenadas = utils.nuevasCoordenadas(transformacion, TapaAtras, false)

        const aux = utils.nuevasCoordenadas(transformacionNormalTangentes, TapaAtras, false)
        const normales = aux.normales
        const tangentes = aux.tangentes



        return {
            vertices: coordenadas.vertices,
            normales,
            tangentes
        }
    }

    construirBloques() {
        const {radioDelAnillo, pasoDiscretoRecorrido, divisionesForma} = this

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


        // Añado puntos extras manualmente
        datosDeLaForma.puntos.splice(9, 0, [0, 1])
        datosDeLaForma.puntos.splice(19, 0, [-2.2, 0])
        datosDeLaForma.puntos.splice(29, 0, [0, -1])
        datosDeLaForma.puntos.splice(39, 0, [2.2, 0])

        datosDeLaForma.normales.splice(9, 0, [0, 1])
        datosDeLaForma.normales.splice(19, 0, [-1, 0])
        datosDeLaForma.normales.splice(29, 0, [0, -1])
        datosDeLaForma.normales.splice(39, 0, [1, 0])

        datosDeLaForma.tangentes.splice(9, 0, [-1, 0])
        datosDeLaForma.tangentes.splice(19, 0, [0, -1])
        datosDeLaForma.tangentes.splice(29, 0, [1, 0])
        datosDeLaForma.tangentes.splice(39, 0, [0, 1])

        const pasoDiscretoForma = datosDeLaForma.puntos.length - 1
        const dimensiones = {
            filas: pasoDiscretoRecorrido, //paso discreto del recorrido
            columnas: pasoDiscretoForma, //divisiones de la forma
        }

        /*
         * P A R T E S
         */
        //Bloques
        const bloque4 = new Superficie(null, "bloque");
        const bloque5 = new Superficie(null, "bloque");
        const bloque6 = new Superficie(null, "bloque");
        const bloque7 = new Superficie(null, "bloque");
        const bloque8 = new Superficie(null, "bloque");

        const porcionCircular_4 = 1 / 8
        const porcionCircular_5 = 1 / 10
        const porcionCircular_6 = 1 / 12
        const porcionCircular_7 = 1 / 14
        const porcionCircular_8 = 1 / 16

        const datosDelRecorridoBloque_4 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular_4, dimensiones["filas"])
        const datosDelRecorridoBloque_5 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular_5, dimensiones["filas"])
        const datosDelRecorridoBloque_6 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular_6, dimensiones["filas"])
        const datosDelRecorridoBloque_7 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular_7, dimensiones["filas"])
        const datosDelRecorridoBloque_8 = utils.crearRecorridoCircular(radioDelAnillo, porcionCircular_8, dimensiones["filas"])



        //Partes de los bloques
        const cuerpo_4 = new SuperficieParametrica1("bloque4_cuerpo", datosDeLaForma, datosDelRecorridoBloque_4, dimensiones, true)
        const cuerpo_5 = new SuperficieParametrica1("bloque5_cuerpo", datosDeLaForma, datosDelRecorridoBloque_5, dimensiones, true)
        const cuerpo_6 = new SuperficieParametrica1("bloque6_cuerpo", datosDeLaForma, datosDelRecorridoBloque_6, dimensiones, true)
        const cuerpo_7 = new SuperficieParametrica1("bloque7_cuerpo", datosDeLaForma, datosDelRecorridoBloque_7, dimensiones, true)
        const cuerpo_8 = new SuperficieParametrica1("bloque8_cuerpo", datosDeLaForma, datosDelRecorridoBloque_8, dimensiones, true)



        const TapaAtras = new TapaSuperficieParametrica(
            "bloque4_tapaAtras", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma})
        const TapaAdelante = new TapaSuperficieParametrica(
            "bloque4_tapaAdelante", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma})


        /*
         * Transformaciones
         */
        const TapaAdelanteTransformacion = mat4.identity(mat4.create());
        mat4.translate(TapaAdelanteTransformacion, TapaAdelanteTransformacion, [15.2, 0, 0]);
        mat4.rotate(TapaAdelanteTransformacion, TapaAdelanteTransformacion, Math.PI / 2, [0, 1, 0]);
        mat4.rotate(TapaAdelanteTransformacion, TapaAdelanteTransformacion, Math.PI, [1, 0, 0]);

        const tapaAdelanteSoloNyTTransformacion = mat4.identity(mat4.create());
        mat4.rotate(tapaAdelanteSoloNyTTransformacion, tapaAdelanteSoloNyTTransformacion, Math.PI / 2, [0, 1, 0]);
        mat4.rotate(tapaAdelanteSoloNyTTransformacion, tapaAdelanteSoloNyTTransformacion, Math.PI, [1, 0, 0]);

        const TapaAdelante_NEW_AUX = utils.nuevasCoordenadas(tapaAdelanteSoloNyTTransformacion, TapaAdelante, false)
        const TapaAdelante_NEW = utils.nuevasCoordenadas(TapaAdelanteTransformacion, TapaAdelante, false)
        TapaAdelante_NEW.normales = TapaAdelante_NEW_AUX.normales
        TapaAdelante_NEW.tangentes = TapaAdelante_NEW_AUX.tangentes


        const TapaAtras4_NEW = this.obtenerNuevasCoordenadasTapaAtras(Math.PI/4, TapaAtras)
        const TapaAtras5_NEW = this.obtenerNuevasCoordenadasTapaAtras(Math.PI/5, TapaAtras)
        const TapaAtras6_NEW = this.obtenerNuevasCoordenadasTapaAtras(Math.PI/6, TapaAtras)
        const TapaAtras7_NEW = this.obtenerNuevasCoordenadasTapaAtras(Math.PI/7, TapaAtras)
        const TapaAtras8_NEW = this.obtenerNuevasCoordenadasTapaAtras(Math.PI/8, TapaAtras)

        //Calculo de Indices

        let perimetroDeLaForma = 0
        let distanciaEntrePtos = []
        let newVTexture = []

        for (let i = 0; i < TapaAdelante.vertices.length; i = i + 3) {

            const P1 = {
                x: TapaAdelante.vertices[i],
                y: TapaAdelante.vertices[i + 1],
                z: TapaAdelante.vertices[i + 2]
            }
            const P2 = {
                x: TapaAdelante.vertices[(i + 3) % (TapaAdelante.vertices.length)],
                y: TapaAdelante.vertices[(i + 4) % (TapaAdelante.vertices.length)],
                z: TapaAdelante.vertices[(i + 5) % (TapaAdelante.vertices.length)]
            }
            //se va a la sig iteracion si P1 o P2 son cero
            if ((P1.x === 0 && P1.y === 0 && P1.z === 0) || (P2.x === 0 && P2.y === 0 && P2.z === 0)) {
                continue
            }

            const D = Math.sqrt(Math.pow(P2.x - P1.x, 2) + Math.pow(P2.y - P1.y, 2) + Math.pow(P2.z - P1.z, 2))
            distanciaEntrePtos.push(D)
            perimetroDeLaForma += D

        }
        //sumar la distancia entre los puntos
        let p = 0
        newVTexture.push(0)
        distanciaEntrePtos.map(distancia => {
            p += distancia
            newVTexture.push(p / perimetroDeLaForma)
        })

        const newUTexture = []

        //17 partes de 1 + 4 puntos de tapas
        for (let i = 0; i < datosDelRecorridoBloque_4.puntos.length + 4; i++) {
            newUTexture.push(i / (datosDelRecorridoBloque_4.puntos.length + 3))
        }

        const nuevasUV = []
        for (let i = 0; i < newUTexture.length; i++) {
            for (let j = 0; j < newVTexture.length; j++) {
                nuevasUV.push(1 - newVTexture[j], newUTexture[i],)
            }
        }


        //Creamos el objeto nuevo con las partes
        const cuerpo_NEW_indices = []
        //cuerpo_4 y cuerpo 5 tienes los mismo indices
        cuerpo_4.indices.forEach(indice => {
            cuerpo_NEW_indices.push(indice + Math.max(...TapaAdelante.indices) + 1);

        });

        const TapaAtras_NEW_indices = []
        TapaAtras.indices.forEach(indice => {
            TapaAtras_NEW_indices.push(indice + Math.max(...cuerpo_NEW_indices) + 1);
        });

        //Indices
        const indices = []
        indices.push(
            ...TapaAdelante.indices, 81, 82,
            ...cuerpo_NEW_indices, 778, 779,
            ...TapaAtras_NEW_indices )
        bloque4.indices.push(...indices);
        bloque5.indices.push(...indices);
        bloque6.indices.push(...indices);
        bloque7.indices.push(...indices);
        bloque8.indices.push(...indices);

        //Vertices
        bloque4.vertices.push(
            ...TapaAdelante_NEW.vertices,
            ...cuerpo_4.vertices,
            ...TapaAtras4_NEW.vertices
        );
        bloque5.vertices.push(
            ...TapaAdelante_NEW.vertices,
            ...cuerpo_5.vertices,
            ...TapaAtras5_NEW.vertices
        );
        bloque6.vertices.push(
            ...TapaAdelante_NEW.vertices,
            ...cuerpo_6.vertices,
            ...TapaAtras6_NEW.vertices
        );
        bloque7.vertices.push(
            ...TapaAdelante_NEW.vertices,
            ...cuerpo_7.vertices,
            ...TapaAtras7_NEW.vertices
        );
        bloque8.vertices.push(
            ...TapaAdelante_NEW.vertices,
            ...cuerpo_8.vertices,
            ...TapaAtras8_NEW.vertices
        );


        //normales
        bloque4.normales.push(
            ...TapaAdelante_NEW.normales,
            ...cuerpo_4.normales,
            ...TapaAtras4_NEW.normales
        );
        bloque5.normales.push(
            ...TapaAdelante_NEW.normales,
            ...cuerpo_5.normales,
            ...TapaAtras5_NEW.normales
        );
        bloque6.normales.push(
            ...TapaAdelante_NEW.normales,
            ...cuerpo_6.normales,
            ...TapaAtras6_NEW.normales
        );
        bloque7.normales.push(
            ...TapaAdelante_NEW.normales,
            ...cuerpo_7.normales,
            ...TapaAtras7_NEW.normales
        );
        bloque8.normales.push(
            ...TapaAdelante_NEW.normales,
            ...cuerpo_8.normales,
            ...TapaAtras8_NEW.normales
        );

        //tangentes
        bloque4.tangentes.push(
            ...TapaAdelante_NEW.tangentes,
            ...cuerpo_4.tangentes,
            ...TapaAtras4_NEW.tangentes
        );
        bloque5.tangentes.push(
            ...TapaAdelante_NEW.tangentes,
            ...cuerpo_5.tangentes,
            ...TapaAtras5_NEW.tangentes
        );
        bloque6.tangentes.push(
            ...TapaAdelante_NEW.tangentes,
            ...cuerpo_6.tangentes,
            ...TapaAtras6_NEW.tangentes
        );
        bloque7.tangentes.push(
            ...TapaAdelante_NEW.tangentes,
            ...cuerpo_7.tangentes,
            ...TapaAtras7_NEW.tangentes
        );
        bloque8.tangentes.push(
            ...TapaAdelante_NEW.tangentes,
            ...cuerpo_8.tangentes,
            ...TapaAtras8_NEW.tangentes
        );

        //UV
        bloque4.textureCoords.push(
            ...nuevasUV
        );
        bloque5.textureCoords.push(
            ...nuevasUV
        );
        bloque6.textureCoords.push(
            ...nuevasUV
        );
        bloque7.textureCoords.push(
            ...nuevasUV
        );
        bloque8.textureCoords.push(
            ...nuevasUV
        );



        let i = 4;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_4].push(bloque4)
        }
        i = 5;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_5].push(bloque5)
        }
        i = 6;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_6].push(bloque6)
        }
        i = 7;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_7].push(bloque7)
        }
        i = 8;
        while (i--) {
            this.dictionary[Bloque.BLOQUES_8].push(bloque8)
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
                texture : "bloque",
                diffuse : colores.Textura.diffuse,
                ambient : colores.Textura.ambient
            });
        });
        this.bloqueActual = this.dictionary[this.type]
    }
}

Bloque.TYPES = ['BLOQUES_8', 'BLOQUES_7', 'BLOQUES_6', 'BLOQUES_5', 'BLOQUES_4'];
Bloque.TYPES.forEach(type => Bloque[type] = type)


