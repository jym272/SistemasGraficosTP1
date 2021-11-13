'use strict';
//import './style.css'
import {utils} from './js/utils';
import {mat4} from "gl-matrix";
import {Program} from "./js/Program";
import {Scene} from "./js/Scene";
import {Floor} from "./js/Floor";
import {Axis} from "./js/Axis";
import {Camera} from "./js/Camera";
import {Controls} from "./js/Controls";
import {Transforms} from "./js/Transforms";
import {
    Tubo,
    Tapa,
    Plano,
    Torus,
    Cilindro,
} from "./js/Superficies";
import {
    Forma,
    TapaSuperficieParametrica,
    SuperficieParametrica,
} from "./js/SuperficiesDeBarrido";

import {CurvaCubicaDeBezier} from "./js/CurvasDeBezier";

let
    gl, scene, program, camera, transforms, construir, bloque,
    elapsedTime, initialTime,
    fixedLight = false,
    triangleStrip = true,
    wireframe = false,
    dxSphere = 0.1,
    dxCone = 0.15,
    spherePosition = 0,
    conePosition = 0,
    frequency = 20; //ms

function configure() {
    // Configure `canvas`
    const canvas = utils.getCanvas('webgl-canvas');
    utils.autoResizeCanvas(canvas);

    // Configure `gl`
    gl = utils.getGLContext(canvas);
    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.clearDepth(100);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Configure `program`
    program = new Program(gl, 'vertex-shader', 'fragment-shader');

    const uniforms = [
        'uProjectionMatrix',
        'uModelViewMatrix',
        'uNormalMatrix',
        'uMaterialDiffuse',
        'uMaterialAmbient',
        'uMaterialSpecular',
        'uLightAmbient',
        'uLightDiffuse',
        'uLightSpecular',
        'uLightPosition',
        'uShininess',
        'uUpdateLight',
        'uWireframe'
    ];

    const attributes = [
        'aVertexPosition',
        'aVertexNormal',
        'aVertexColor',
    ];

    // Load attributes and uniforms
    program.load(attributes, uniforms);

    // Configure `scene`
    scene = new Scene(gl, program);

    // Configure `camera` and `controls`
    camera = new Camera(Camera.ORBITING_TYPE, 70,0);
    camera.goHome([0, 0, 40]);
    camera.setFocus([0, 0, 0]);
    new Controls(camera, canvas);

    // Configure `transforms`
    transforms = new Transforms(gl, program, camera, canvas);

    gl.uniform3fv(program.uLightPosition, [0, 8, 24]);
    gl.uniform4fv(program.uLightAmbient, [0.2, 0.2, 0.2, 1]);
    gl.uniform4fv(program.uLightDiffuse, [1, 1, 1, 1]);
    gl.uniform4fv(program.uLightSpecular, [1, 1, 1, 1]);
    gl.uniform1f(program.uShininess, 230);

    //Transformaciones afines
    construir = new TransformacionesAfin();

}
/*
 * COLORES
 */
const colorPastilla = [169/255, 183/255, 43/255, 1];
const colorPanelSolar = [86/255, 16/255, 248/255, 1]; //colorPastilla;
const colorGenerico = [0.71875,0.0,0.1796,1.0];
const colorVioleta = [255/255,0/255,138/255,1.0];
/*
 * Constantes Paneles Solares
 */
let filasDeTubosSecundarios = 4; //Se comienza con 4 filas
let anguloRotacionPanelSolar = 310; //grados inciales
const distanciaEntreTubosSecundarios = 2
const fc = 2.15 //factor de correccion para el largo del tubo
const dimensionesTuboPrincipal = {
    radio: 0.15,
    altura: filasDeTubosSecundarios * distanciaEntreTubosSecundarios + fc,
}
const dimensionesTuboSecundario = {
    radio: 0.05,
    altura: 2.0,
}
const dimensionesPanelSolar = {
    ancho: 1.3,
    largo: 6,
}
const dimensionesTriangulosTubo = {
    filas: 1,
    columnas: 20,
}
const dimensionesTriangulosPlano = {
    filas: 1,
    columnas: 1,
}
const dimensionesTriangulosTapa = dimensionesTriangulosTubo
/*
 * Constantes Anillo
 */
let arc =  Math.PI * 2;

const dimensionesTriangulosTorus = {
    filas: 20, //segmentosTubulares   //para el deploy 30
    columnas: 70, //segmentosRadiales  //para el deploy 80
}
const radioDelAnillo = 15.20,
      radioInteriorDelAnillo = 0.8,
    distanciaEntreTubos = 0.40;
const dimTuboAnillo = {
    radio: 0.05,
    altura: radioDelAnillo*2,
}
const dimTuboInteriorAnillo = {
    radio: 0.05,
    altura: distanciaEntreTubos*2*Math.sqrt(2),
}
const dimTriangulosTuboAnillo = {
    filas: 1,
    columnas: 10,
}
//pastilla del anillo
const dimensionesPastillaCuerpo = {
    radio : 2.50,
    altura: 0.8,
};


const dimensionesCilindroPastilla = {
    radioSuperior: 2.30,
    radioInferior: dimensionesPastillaCuerpo.radio,
    altura: 0.10,
};
const dimensionesTriangulosPastilla = {
    filas : 1, //segmentosRadiales
    columnas : 50, //segmentosDeAltura
};
/*
 * Constantes Nucleo
 */
//nucleo del panel solar:
const dimensionesTriangulosNucleo = dimensionesTriangulosPastilla
const dimensionesNucleoPS = {
    radio : 2.00,
    altura: 4.0,
};
const dimensionesCilindroNucleoPS = { //dimensiones de todos los nucleos
    radioSuperior: 1.6,
    radioInferior: dimensionesNucleoPS.radio,
    altura: 0.7,
};
/*
 * Constantes Modulo Violeta
 */
const profundidadModuloVioleta = 2.0;
/*
 * Constantes Bloques del Anillo
 */
//ubicar las tapas de los bloques
const coordTapaSuperior =10.748 //para x e y
let
    anguloGiroTapaSuperior,
    anguloGiroTapaInferior;

// Se carga todos los objetos a la escena
function load() {
    scene.add(new Floor(80, 2));
    scene.add(new Axis(82));

    cargarNucleo()
    cargarPanelesSolares()
    cargarAnillo()
    bloque = new Bloque(Bloque.BLOQUES_4)
    moduloVioleta()


}
function crearRecorridoCircular(radio,t, divisiones){

    const phi = 2*Math.PI *t

    const arrayCoordenadas = []
    const arrayNormales = []
    const arrayTangentes = []
    for (let i = 0; i <= divisiones; i++) {
        const angulo =  phi * i/divisiones

        const x = radio * Math.cos(angulo)
        const y = radio * Math.sin(angulo)
        //y las normales son
        const nx = Math.cos(angulo)
        const ny = Math.sin(angulo)
        //y las tangentes son
        const tx = -Math.sin(angulo)
        const ty = Math.cos(angulo)

        arrayCoordenadas.push([x,y])
        arrayNormales.push([nx,ny,0])
        arrayTangentes.push([tx,ty, 0])

    }
    const normal = [0,0,1] //normal de la curva es el eje z,

    return {
        puntos : arrayCoordenadas,
        tangentes: arrayTangentes,
        binormales: arrayNormales,
        vectorNormal : normal
    };
}


class Bloque{
    constructor(type = Bloque.BLOQUES_8, pasoDiscretoRecorrido = 30, divisionesForma = 10) {

        this.bloqueActual = null
        this.pasoDiscretoRecorrido = pasoDiscretoRecorrido
        this.divisionesForma = divisionesForma
        this.dictionary = {};
        Bloque.TYPES.forEach(item => {
            this.dictionary[item] = []
        });
        this.construirBloques()
        this.setType(type)
    }
    construirBloques(){

        const pasoDiscretoRecorrido = this.pasoDiscretoRecorrido;
        const divisionesForma = this.divisionesForma //de las curvas de Bezier

        //Forma del frente del bloque
        const formaSuperficie = new Forma();
        //conservar el ingreso de datos, bezier, punto, bezier, punto .... IMPORTANTE PARA LAS NORMALES
        formaSuperficie.iniciarEn(2.2,0.6)
        formaSuperficie.CurvaBezierA(2.2,0.8,2,1,1.8,1)
        formaSuperficie.lineaA(-1.8,1)
        formaSuperficie.CurvaBezierA(-2,1,-2.2,0.8,-2.2,0.6)
        formaSuperficie.lineaA(-2.2,-0.6)
        formaSuperficie.CurvaBezierA(-2.2,-0.8,-2,-1,-1.8,-1)
        formaSuperficie.lineaA(1.8,-1)
        formaSuperficie.CurvaBezierA(2,-1,2.2,-0.8,2.2,-0.6)
        formaSuperficie.lineaA(2.2,0.6).curvaCerrada(true)  //la ultima tangente/normal a mano->Observar la direccion de la normal


        const datosDeLaForma = crearForma(divisionesForma, formaSuperficie)
        const pasoDiscretoForma = datosDeLaForma.puntos.length-1
        const dimensiones = {
            filas: pasoDiscretoRecorrido, //paso discreto del recorrido
            columnas: pasoDiscretoForma, //divisiones de la forma
        }

        //Bloque8
        const fullBloque = 1.0
        dimensiones["filas"] = 2*pasoDiscretoRecorrido +10 //se ajusta las dimensiones para grandes recorridos
        const datosDelRecorridoFull = crearRecorridoCircular(radioDelAnillo, fullBloque, dimensiones["filas"])
        this.dictionary[Bloque.BLOQUES_8].push(new SuperficieParametrica("bloque8", datosDeLaForma, datosDelRecorridoFull, dimensiones, true))

        dimensiones["filas"] = pasoDiscretoRecorrido
        //Bloque7
        const Bloque7 = 7/8
        dimensiones["filas"] = 2*pasoDiscretoRecorrido
        const datosDelRecorridoBloque7 = crearRecorridoCircular(radioDelAnillo, Bloque7, dimensiones["filas"])
        this.dictionary[Bloque.BLOQUES_7].push( new SuperficieParametrica("bloque7", datosDeLaForma, datosDelRecorridoBloque7, dimensiones, true))
        dimensiones["filas"] = pasoDiscretoRecorrido

        this.dictionary[Bloque.BLOQUES_7].push(new TapaSuperficieParametrica(
            "bloque7TapaAdelante", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}))

        this.dictionary[Bloque.BLOQUES_7].push(new TapaSuperficieParametrica(
            "bloque7TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))

        //BLoque6
        const Bloque6 = 5/8
        dimensiones["filas"] = pasoDiscretoRecorrido + 20

        const datosDelRecorridoBloque6= crearRecorridoCircular(radioDelAnillo, Bloque6, dimensiones["filas"])
        this.dictionary[Bloque.BLOQUES_6].push( new SuperficieParametrica("bloque6", datosDeLaForma, datosDelRecorridoBloque6, dimensiones, true))
        dimensiones["filas"] = pasoDiscretoRecorrido

        const Bloque1 = 1/8
        const datosDelRecorridoBloque1= crearRecorridoCircular(radioDelAnillo, Bloque1, pasoDiscretoRecorrido)

        //reutilizo las transformaciones de esta tapa para el bloque 6
        this.dictionary[Bloque.BLOQUES_6].push(new TapaSuperficieParametrica(
            "bloque7TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_6].push(new TapaSuperficieParametrica(
            "bloque6TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_6].push( new SuperficieParametrica("bloque61", datosDeLaForma, datosDelRecorridoBloque1, dimensiones, true))
        this.dictionary[Bloque.BLOQUES_6].push(new TapaSuperficieParametrica(
            "bloque61TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_6].push(new TapaSuperficieParametrica(
            "bloque61TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        //Bloque5
        const Bloque5 = 3/8
        const datosDelRecorridoBloque5= crearRecorridoCircular(radioDelAnillo, Bloque5, pasoDiscretoRecorrido)
        this.dictionary[Bloque.BLOQUES_5].push( new SuperficieParametrica("bloque5", datosDeLaForma, datosDelRecorridoBloque5, dimensiones, true))
        //reutilizo las transformaciones de esta tapa para el bloque 5
        this.dictionary[Bloque.BLOQUES_5].push(new TapaSuperficieParametrica(
            "bloque7TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_5].push(new TapaSuperficieParametrica(
            "bloque5TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_5].push( new SuperficieParametrica("bloque61", datosDeLaForma, datosDelRecorridoBloque1, dimensiones, true))
        this.dictionary[Bloque.BLOQUES_5].push(new TapaSuperficieParametrica(
            "bloque61TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_5].push(new TapaSuperficieParametrica(
            "bloque61TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_5].push( new SuperficieParametrica("bloque51", datosDeLaForma, datosDelRecorridoBloque1, dimensiones, true))
        this.dictionary[Bloque.BLOQUES_5].push(new TapaSuperficieParametrica(
            "bloque51TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_5].push(new TapaSuperficieParametrica(
            "bloque51TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        //Bloque4
        this.dictionary[Bloque.BLOQUES_4].push( new SuperficieParametrica("bloque4", datosDeLaForma, datosDelRecorridoBloque1, dimensiones, true))
        this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
            "bloque4TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
            "bloque4TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_4].push( new SuperficieParametrica("bloque4", datosDeLaForma, datosDelRecorridoBloque1, dimensiones, true))
        this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
            "bloque4TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
            "bloque4TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_4].push( new SuperficieParametrica("bloque4", datosDeLaForma, datosDelRecorridoBloque1, dimensiones, true))
        this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
            "bloque4TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
            "bloque4TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_4].push( new SuperficieParametrica("bloque4", datosDeLaForma, datosDelRecorridoBloque1, dimensiones, true))
        this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
            "bloque4TapaAdelante", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
        this.dictionary[Bloque.BLOQUES_4].push(new TapaSuperficieParametrica(
            "bloque4TapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}))
    }

    setType(type) {
        ~Bloque.TYPES.indexOf(type)
            ? this.type = type
            : console.error(`Bloque type (${type}) not supported`);

            if(this.bloqueActual != null)
                this.bloqueActual.forEach(item => {
                    scene.remove(item.alias)
                });

            this.actualizarEscena()
    }
    actualizarEscena(){
        this.dictionary[this.type].forEach(item => {
            scene.add(item,{
                diffuse: colorVioleta,
            });
        });
        this.bloqueActual = this.dictionary[this.type]
    }
}
Bloque.TYPES = ['BLOQUES_8', 'BLOQUES_7', 'BLOQUES_6', 'BLOQUES_5', 'BLOQUES_4'];
Bloque.TYPES.forEach(type => Bloque[type] = type)

//Cuidado, la ultima tangente esta a mano, verificar dependiendo la forma
function crearForma(divisiones, formaSuperficie){

    const { puntos, puntosTangentes } = formaSuperficie.extraerPuntos(divisiones)
    const normales = utils.calcularNormales(puntosTangentes)

    if(puntos.length !== normales.length){
        console.error("Se agrega la normal [1,0] al pt:",puntos[puntos.length - 1])
        normales.push([1,0])  //la ultima tangente/normal a mano

    }
    return {
        puntos,
        normales
    };
}

function crearRecorrido(pasoDiscreto, curvaRecorrido, normalDelCamino = [1,0,0]) {

    const {puntos,puntosTangentes} = curvaRecorrido.extraerPuntos(pasoDiscreto)
   // console.log(puntos, tangentes)
    const arrayDeTangentes = utils.pasarTanAVector3(puntosTangentes)

    const vectorNormal = normalDelCamino
    const arrayDeBinormales = utils.calcularVectorBinormal(vectorNormal, arrayDeTangentes)


    //comparar la longitud de puntos, tangentes, y binormales, y si son distintos devolver error
    if(puntos.length !== puntosTangentes.length || puntosTangentes.length !== arrayDeBinormales.length){
        console.error("No coinciden puntos, tangentes y binormales",puntos.length, puntosTangentes.length, arrayDeBinormales.length)
    }

    return {
        puntos,
        tangentes: arrayDeTangentes,
        binormales: arrayDeBinormales,
        vectorNormal
    }
}

function moduloVioleta(){
    const pasoDiscretoRecorrido = 1;
    const divisionesForma = 20

    const curvaRecorrido = new CurvaCubicaDeBezier(
        [0,0],
        [0.666,0],
        [1.333,0],
        [profundidadModuloVioleta,0]
    );

    const formaSuperficie = new Forma();
    //conservar el ingreso de datos, bezier, punto, bezier, punto .... IMPORTANTE PARA LAS NORMALES
    formaSuperficie.iniciarEn(1,0.5)
        .CurvaBezierA(1,0.8,0.8,1,0.5,1)
        .lineaA(-0.5,1)
        .CurvaBezierA(-0.8,1,-1,0.8,-1,0.5)
        .lineaA(-1,-0.5)
        .CurvaBezierA(-1,-0.8,-0.8,-1,-0.5,-1)
        .lineaA(0.5,-1)
        .CurvaBezierA(0.8,-1,1,-0.8,1,-0.5)
        .lineaA(1,0.5).curvaCerrada(true)  //la ultima tangente/normal a mano


    const datosDelRecorrido = crearRecorrido(pasoDiscretoRecorrido, curvaRecorrido)


    const datosDeLaForma = crearForma(divisionesForma, formaSuperficie)


   const pasoDiscretoForma = datosDeLaForma.puntos.length-1

   const dimensiones = {
       filas: pasoDiscretoRecorrido, //paso discreto del recorrido
       columnas: pasoDiscretoForma, //divisiones de la forma
   }

   scene.add(new SuperficieParametrica("moduloVioletaPS", datosDeLaForma, datosDelRecorrido, dimensiones),{
       diffuse: colorVioleta,
   });
   scene.add(new SuperficieParametrica("moduloVioletaAnillo", datosDeLaForma, datosDelRecorrido, dimensiones),{
       diffuse: colorVioleta,
   });

   //No necesito las tapas
   /*
   scene.add(new TapaSuperficieParametrica(
       "moduloVioletaPSTapaAdelante", datosDeLaForma.puntos, {filas: 1, columnas: pasoDiscretoForma}),{
       diffuse: colorVioleta,
   });


   scene.add(new TapaSuperficieParametrica(
       "moduloVioletaPSTapaAtras", datosDeLaForma.puntos,  {filas: 1, columnas: pasoDiscretoForma}),{
       diffuse: colorVioleta,
   });
*/



}

function cargarNucleo(){
    //nucleo del panel solar
    {
        scene.add(new Tubo('nucleoPS', dimensionesNucleoPS, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });

        scene.add(new Cilindro('nucleoPSCilindroSup', dimensionesCilindroNucleoPS, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });
        scene.add(new Cilindro('nucleoPSCilindroInf', dimensionesCilindroNucleoPS, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });

        scene.add(new Tapa('nucleoPSTapaSup', dimensionesCilindroNucleoPS.radioSuperior, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });

        scene.add(new Tapa('nucleoPSTapaInf', dimensionesCilindroNucleoPS.radioSuperior, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });
    }
    //nucleo del anillo
    {
        scene.add(new Tubo('nucleoAnillo', dimensionesNucleoPS, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });

        scene.add(new Cilindro('nucleoAnilloCilindroSup', dimensionesCilindroNucleoPS, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });
        scene.add(new Cilindro('nucleoAnilloCilindroInf', dimensionesCilindroNucleoPS, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });

        scene.add(new Tapa('nucleoAnilloTapaSup', dimensionesCilindroNucleoPS.radioSuperior, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });

        scene.add(new Tapa('nucleoAnilloTapaInf', dimensionesCilindroNucleoPS.radioSuperior, dimensionesTriangulosNucleo), {
            diffuse: colorGenerico,
        });
    }
    //nucleo circular
    //nucleos violea - Bezier

}

function cargarAnillo(){
    //pastilla

    scene.add(new Tubo('pastillaCuerpo', dimensionesPastillaCuerpo, dimensionesTriangulosPastilla), {
        diffuse: colorPastilla,
    });
    scene.add(new Cilindro('pastillaCilindroSup', dimensionesCilindroPastilla, dimensionesTriangulosPastilla), {
        diffuse: colorPastilla,
    });
    scene.add(new Cilindro('pastillaCilindroInf', dimensionesCilindroPastilla, dimensionesTriangulosPastilla), {
        diffuse: colorPastilla,
    });
    scene.add(new Tapa('pastillaTapaSup', dimensionesCilindroPastilla.radioSuperior, dimensionesTriangulosPastilla), {
        diffuse: colorPastilla,
    });
    scene.add(new Tapa('pastillaTapaInf', dimensionesCilindroPastilla.radioSuperior, dimensionesTriangulosPastilla), {
        diffuse: colorPastilla,
    });

    //anillo y tubos interiores

    scene.add(new Torus("torus",radioDelAnillo, radioInteriorDelAnillo,dimensionesTriangulosTorus, arc))
    scene.add(new Tubo('anillo_tuboH1', dimTuboAnillo, dimTriangulosTuboAnillo))
    scene.add(new Tubo('anillo_tuboH2', dimTuboAnillo, dimTriangulosTuboAnillo))

    scene.add(new Tubo('anillo_tuboV1', dimTuboAnillo, dimTriangulosTuboAnillo))
    scene.add(new Tubo('anillo_tuboV2', dimTuboAnillo, dimTriangulosTuboAnillo))

    const cantidadDeAnillosInteriores = 2 * Math.ceil(dimTuboAnillo.altura/(distanciaEntreTubos*2))

    for (let i = 0; i < cantidadDeAnillosInteriores; i++) {
         scene.add(new Tubo('anillo_tuboInterior', dimTuboInteriorAnillo, dimTriangulosTuboAnillo))
    }






}

function removerPanelesSolares(){
    scene.remove('tuboPrincipal');
    scene.remove('tapaPrincipal');
    for (let i = 0; i < filasDeTubosSecundarios; i++) {
        scene.remove('tuboSecundario');
        scene.remove('tapaSecundaria1');
        scene.remove('tapaSecundaria2');

        scene.remove('panelSolar1')
        scene.remove('panelSolar2')
    }
}

function cargarPanelesSolares(){
    scene.add(new Tubo('tuboPrincipal', dimensionesTuboPrincipal, dimensionesTriangulosTubo))
    scene.add(new Tapa('tapaPrincipal', dimensionesTuboPrincipal.radio, dimensionesTriangulosTapa))


    for (let i = 0; i < filasDeTubosSecundarios; i++) {
        scene.add(new Tubo('tuboSecundario', dimensionesTuboSecundario, dimensionesTriangulosTubo))
        scene.add(new Tapa('tapaSecundaria1', dimensionesTuboSecundario.radio, dimensionesTriangulosTapa))
        scene.add(new Tapa('tapaSecundaria2', dimensionesTuboSecundario.radio, dimensionesTriangulosTapa))

        scene.add( new Plano('panelSolar1', dimensionesPanelSolar, dimensionesTriangulosPlano), {
            diffuse: colorPanelSolar,
        });
        scene.add( new Plano('panelSolar2', dimensionesPanelSolar, dimensionesTriangulosPlano), {
            diffuse: colorPanelSolar,
        });
    }
}
/*
 * Matrices para las Transformaciones
 */
const Nucleo = {
    nucleoPSTransform : null,
    nucleoAnilloTransform : null,
}
const Nave = { //abstraccion de la nave
    naveTransform : null, // es como el cero
}
const PanelesSolares= {
    tuboTransform : null,
    tuboSecundarioTransform : null,
    distanciaRelativaConElTuboPrincipal : 3.5, //se tiene que resetear luego de dibujar todos los paneles
    distanciaConElNucleo: 4.5,
}
const Anillo = {
    torusTransform :  null, //transforms.modelViewMatrix, //momentario sino null es para los segmentos del menu
    distanciaTubosInteriores : radioDelAnillo,
    sentidoTuboInterior : 1,
    desplazamientoTuboInterior : 0,
    factorDesplazamientoEntreTubosInteriores: 3,
    //pastilla
    pastillaTransform : null,
    alturaTapaSuperior : 0.9,
    alturaTapaInferior : 0.1,
}
const Bloques = {
    bloqueTransform : null,
    centrarElBloque : 0.42,

    distanciaNucleoDelAnilloYNave : dimensionesNucleoPS.altura + dimensionesCilindroNucleoPS.altura,
    distanciaModuloVioletaYNave : dimensionesNucleoPS.altura + 2*dimensionesCilindroNucleoPS.altura +profundidadModuloVioleta,
    posicionBloque : 0,


}
class TransformacionesAfin{
    constructor() {
    }
    setAlias(alias){
        this.alias = alias;
    }
    bloques() {
        if(this.alias === 'bloque7'){
            Bloques.bloqueTransform = transforms.modelViewMatrix

            mat4.rotate(Bloques.bloqueTransform, Anillo.pastillaTransform, -3*Math.PI/8, [0,1, 0])
            mat4.translate(Bloques.bloqueTransform, Bloques.bloqueTransform, [0, Bloques.centrarElBloque, 0])
            mat4.rotate(Bloques.bloqueTransform, Bloques.bloqueTransform, Math.PI/2, [1,0, 0])

        }else if(this.alias === 'bloque7TapaAdelante'){
            const bloque7TapaAdelanteTransform = transforms.modelViewMatrix
            mat4.translate(bloque7TapaAdelanteTransform, Bloques.bloqueTransform, [radioDelAnillo, 0, 0])
            mat4.rotate(bloque7TapaAdelanteTransform, bloque7TapaAdelanteTransform,Math.PI, [1, 0, 1])
        }else if(this.alias === 'bloque7TapaAtras'){
            const bloque7TapaAtrasTransform = transforms.modelViewMatrix

            mat4.translate(bloque7TapaAtrasTransform, Bloques.bloqueTransform, [radioDelAnillo/Math.sqrt(2), -radioDelAnillo/Math.sqrt(2), 0])
            mat4.rotate(bloque7TapaAtrasTransform, bloque7TapaAtrasTransform,Math.PI, [1, 0, 1])
            mat4.rotate(bloque7TapaAtrasTransform, bloque7TapaAtrasTransform,3*Math.PI/4, [1, 0, 0])
        }
        else if(this.alias === 'bloque8'){
            Bloques.bloqueTransform = transforms.modelViewMatrix
            mat4.translate(Bloques.bloqueTransform, Anillo.pastillaTransform, [0, Bloques.centrarElBloque, 0])
            mat4.rotate(Bloques.bloqueTransform, Bloques.bloqueTransform, Math.PI/2, [1,0, 0])
        }else if(this.alias === 'bloque6') {
            Bloques.bloqueTransform = transforms.modelViewMatrix
            const angulo = -(135+22.5) * Math.PI / 180
            mat4.rotate(Bloques.bloqueTransform, Anillo.pastillaTransform, angulo, [0,1, 0])
            mat4.translate(Bloques.bloqueTransform, Bloques.bloqueTransform, [0, Bloques.centrarElBloque, 0])
            mat4.rotate(Bloques.bloqueTransform, Bloques.bloqueTransform, Math.PI/2, [1,0, 0])
        }else if(this.alias === 'bloque6TapaAtras'){
            const bloque6TapaAtrasTransform = transforms.modelViewMatrix
            const angulo = 45
            const y = radioDelAnillo*Math.sin((angulo) * Math.PI / 180)
            const x = radioDelAnillo*Math.cos((angulo) * Math.PI / 180)
            mat4.translate(bloque6TapaAtrasTransform, Bloques.bloqueTransform, [-x, -y, 0])
            mat4.rotate(bloque6TapaAtrasTransform, bloque6TapaAtrasTransform,Math.PI, [1, 0, 1])
            mat4.rotate(bloque6TapaAtrasTransform, bloque6TapaAtrasTransform,angulo* Math.PI / 180, [1, 0, 0])

        }else if (this.alias === 'bloque61'){
            const bloque61Transform = transforms.modelViewMatrix
            const angulo = -(90) * Math.PI / 180
            mat4.rotate(bloque61Transform, Bloques.bloqueTransform, angulo, [0,0, 1])
        }else if( this.alias === 'bloque61TapaAdelante'){
            const bloque61TapaAdelanteTransform = transforms.modelViewMatrix
            const angulo = 135

            const y = radioDelAnillo*Math.sin((angulo) * Math.PI / 180)
            const x = radioDelAnillo*Math.cos((angulo) * Math.PI / 180)
            mat4.translate(bloque61TapaAdelanteTransform, Bloques.bloqueTransform, [-x, -y, 0])
            mat4.rotate(bloque61TapaAdelanteTransform, bloque61TapaAdelanteTransform,Math.PI, [1, 0, 1])
            mat4.rotate(bloque61TapaAdelanteTransform, bloque61TapaAdelanteTransform,angulo* Math.PI / 180, [1, 0, 0])

        }else if( this.alias === 'bloque61TapaAtras'){
            const bloque61TapaAtrasTransform = transforms.modelViewMatrix
            const angulo = 90

            const y = radioDelAnillo*Math.sin((angulo) * Math.PI / 180)
            const x = radioDelAnillo*Math.cos((angulo) * Math.PI / 180)
            mat4.translate(bloque61TapaAtrasTransform, Bloques.bloqueTransform, [-x, -y, 0])
            mat4.rotate(bloque61TapaAtrasTransform, bloque61TapaAtrasTransform,Math.PI, [1, 0, -1])
            mat4.rotate(bloque61TapaAtrasTransform, bloque61TapaAtrasTransform,angulo* Math.PI / 180, [1, 0, 0])

        }else if(this.alias === 'bloque5') {
            Bloques.bloqueTransform = transforms.modelViewMatrix
            const angulo = (90 +22.5) * Math.PI / 180
            mat4.rotate(Bloques.bloqueTransform, Anillo.pastillaTransform, angulo, [0,1, 0])
            mat4.translate(Bloques.bloqueTransform, Bloques.bloqueTransform, [0, Bloques.centrarElBloque, 0])
            mat4.rotate(Bloques.bloqueTransform, Bloques.bloqueTransform, Math.PI/2, [1,0, 0])
        }else if(this.alias === 'bloque5TapaAtras'){
            const bloque5TapaAtrasTransform = transforms.modelViewMatrix
            const angulo = -45
            const y = radioDelAnillo*Math.sin((angulo) * Math.PI / 180)
            const x = radioDelAnillo*Math.cos((angulo) * Math.PI / 180)
            mat4.translate(bloque5TapaAtrasTransform, Bloques.bloqueTransform, [-x, -y, 0])
            mat4.rotate(bloque5TapaAtrasTransform, bloque5TapaAtrasTransform,Math.PI, [1, 0, 1])
            mat4.rotate(bloque5TapaAtrasTransform, bloque5TapaAtrasTransform,angulo* Math.PI / 180, [1, 0, 0])
        }else if (this.alias === 'bloque51'){
            const bloque51Transform = transforms.modelViewMatrix
            const angulo = -(90*2) * Math.PI / 180
            mat4.rotate(bloque51Transform, Bloques.bloqueTransform, angulo, [0,0, 1])
        }else if( this.alias === 'bloque51TapaAdelante'){
            const bloque51TapaAdelanteTransform = transforms.modelViewMatrix
            const angulo = 135-90

            const y = radioDelAnillo*Math.sin((angulo) * Math.PI / 180)
            const x = radioDelAnillo*Math.cos((angulo) * Math.PI / 180)
            mat4.translate(bloque51TapaAdelanteTransform, Bloques.bloqueTransform, [-x, -y, 0])
            mat4.rotate(bloque51TapaAdelanteTransform, bloque51TapaAdelanteTransform,Math.PI, [1, 0, 1])
            mat4.rotate(bloque51TapaAdelanteTransform, bloque51TapaAdelanteTransform,angulo* Math.PI / 180, [1, 0, 0])

        }else if( this.alias === 'bloque51TapaAtras'){
            const bloque51TapaAtrasTransform = transforms.modelViewMatrix
            const angulo = 0
            const y = radioDelAnillo*Math.sin((angulo) * Math.PI / 180)
            const x = radioDelAnillo*Math.cos((angulo) * Math.PI / 180)
            mat4.translate(bloque51TapaAtrasTransform, Bloques.bloqueTransform, [-x, -y, 0])
            mat4.rotate(bloque51TapaAtrasTransform, bloque51TapaAtrasTransform,Math.PI/2, [0, 1, 0])
        }else if(this.alias === 'bloque4') {
            Bloques.bloqueTransform = transforms.modelViewMatrix
            const angulo = (22.5 + 90*Bloques.posicionBloque) * Math.PI / 180
            mat4.rotate(Bloques.bloqueTransform, Anillo.pastillaTransform, angulo, [0,1, 0])
            mat4.translate(Bloques.bloqueTransform, Bloques.bloqueTransform, [0, Bloques.centrarElBloque, 0])
            mat4.rotate(Bloques.bloqueTransform, Bloques.bloqueTransform, Math.PI/2, [1,0, 0])
            Bloques.posicionBloque++
        }else if( this.alias === 'bloque4TapaAdelante'){
            const bloque4TapaAdelanteTransform = transforms.modelViewMatrix
            const angulo = 0
            const y = radioDelAnillo*Math.sin((angulo) * Math.PI / 180)
            const x = radioDelAnillo*Math.cos((angulo) * Math.PI / 180)
            mat4.translate(bloque4TapaAdelanteTransform, Bloques.bloqueTransform, [x, y, 0])
            mat4.rotate(bloque4TapaAdelanteTransform, bloque4TapaAdelanteTransform,Math.PI, [1, 0, 1])

        }else if( this.alias === 'bloque4TapaAtras'){
            const bloque4TapaAtrasTransform = transforms.modelViewMatrix
            const angulo = 45
            const y = radioDelAnillo*Math.sin((angulo) * Math.PI / 180)
            const x = radioDelAnillo*Math.cos((angulo) * Math.PI / 180)
            mat4.translate(bloque4TapaAtrasTransform, Bloques.bloqueTransform, [x, y, 0])
            mat4.rotate(bloque4TapaAtrasTransform, bloque4TapaAtrasTransform,Math.PI, [1, 0, -1])
            mat4.rotate(bloque4TapaAtrasTransform, bloque4TapaAtrasTransform,135* Math.PI / 180, [1, 0, 0])

        }
    }

    modulosVioleta(){
        if (this.alias === 'moduloVioletaPS') {
            Nave.naveTransform = transforms.modelViewMatrix
            const moduloVioletaPSTransform = transforms.modelViewMatrix
            mat4.translate(moduloVioletaPSTransform, Nave.naveTransform, [0, 0, 0])

        } else if (this.alias === 'moduloVioletaAnillo') {
            Nave.naveTransform = transforms.modelViewMatrix
            const moduloVioletaAnilloTransform = transforms.modelViewMatrix
            mat4.translate(moduloVioletaAnilloTransform, Nave.naveTransform, [0, 0,
                -Bloques.distanciaModuloVioletaYNave ])
        }
        /* No necesito las tapas
        if(this.alias === 'moduloVioletaPSTapaAdelante') {
            const tapates = transforms.modelViewMatrix;
            mat4.translate(tapates, tapates, [0, 0, 2]);
            mat4.rotate(tapates, tapates, Math.PI/2, [1, 0, 0]);
        } else if(this.alias === 'moduloVioletaPSTapaAtras') {
            const tapates = transforms.modelViewMatrix;
            mat4.translate(tapates, tapates, [0, 0, 0]);
            mat4.rotate(tapates, tapates, -Math.PI/2, [1, 0, 0]);
        }

         */

    }

    nucleoDelPanelSolar(){
        const distanciaModuloVioleta = profundidadModuloVioleta + dimensionesCilindroNucleoPS.altura
        if (this.alias === 'nucleoPS') {
            Nave.naveTransform = transforms.modelViewMatrix
            Nucleo.nucleoPSTransform = transforms.modelViewMatrix
            mat4.translate(Nucleo.nucleoPSTransform, Nave.naveTransform, [0, 0, distanciaModuloVioleta])
            mat4.rotate(Nucleo.nucleoPSTransform,Nucleo.nucleoPSTransform , Math.PI/2, [1, 0, 0])

        }else if (this.alias === 'nucleoPSCilindroSup') {
            const nucleoPSCilindroSupTransform = transforms.modelViewMatrix;
            mat4.rotate(nucleoPSCilindroSupTransform, Nucleo.nucleoPSTransform, Math.PI / 2, [0, 1, 0]);
            mat4.translate(nucleoPSCilindroSupTransform, nucleoPSCilindroSupTransform, [0, dimensionesNucleoPS.altura, 0]);

        }else if (this.alias === 'nucleoPSCilindroInf') {
            const nucleoPSCilindroInfTransform = transforms.modelViewMatrix;
            mat4.rotate(nucleoPSCilindroInfTransform, Nucleo.nucleoPSTransform, -Math.PI/2, [0, 1, 0]);
            mat4.rotate(nucleoPSCilindroInfTransform, nucleoPSCilindroInfTransform, -Math.PI, [1, 0, 0]);
        }else if (this.alias === 'nucleoPSTapaSup') {
            const nucleoPSTapaSupTransform = transforms.modelViewMatrix;
            mat4.translate(nucleoPSTapaSupTransform, Nucleo.nucleoPSTransform, [0,
                dimensionesNucleoPS.altura + dimensionesCilindroNucleoPS.altura, 0]);

        }else if (this.alias === 'nucleoPSTapaInf') {
            const nucleoPSTapaInfTransform = transforms.modelViewMatrix;
            mat4.rotate(nucleoPSTapaInfTransform, Nucleo.nucleoPSTransform, Math.PI, [1, 0, 0]);
            mat4.translate(nucleoPSTapaInfTransform, nucleoPSTapaInfTransform, [0,
                dimensionesCilindroNucleoPS.altura, 0]);
        }
    }

    panelesSolares(){
        if (this.alias === 'tuboPrincipal') {  //CONEXION CON EL NUCLEOPS

            PanelesSolares.tuboTransform = transforms.modelViewMatrix;
            mat4.translate(PanelesSolares.tuboTransform, Nucleo.nucleoPSTransform, [0, PanelesSolares.distanciaConElNucleo, 0]);
            // mat4.rotateX(ps.tuboTransform, ps.tuboTransform, Math.PI/2); //puedo rotar todo
            //  El tubo principal ACAAA
        }else if (this.alias === 'tapaPrincipal') {

            const tapaPrincipalTransform = transforms.modelViewMatrix;
            mat4.translate(tapaPrincipalTransform, PanelesSolares.tuboTransform, [0, dimensionesTuboPrincipal.altura, 0]);

        }else if(this.alias === 'tuboSecundario'){

            PanelesSolares.tuboSecundarioTransform = transforms.modelViewMatrix;
            mat4.translate(PanelesSolares.tuboSecundarioTransform, PanelesSolares.tuboTransform, [dimensionesTuboSecundario.altura/2,PanelesSolares.distanciaRelativaConElTuboPrincipal, 0]);
            mat4.rotateZ(PanelesSolares.tuboSecundarioTransform, PanelesSolares.tuboSecundarioTransform, Math.PI/2);
            PanelesSolares.distanciaRelativaConElTuboPrincipal+=distanciaEntreTubosSecundarios

        }else if (this.alias === 'tapaSecundaria1'){
            const tapaSecundariaTransform = transforms.modelViewMatrix;
            mat4.translate(tapaSecundariaTransform, PanelesSolares.tuboSecundarioTransform, [0, dimensionesTuboSecundario.altura, 0]);
        }else if (this.alias === 'tapaSecundaria2'){
            const tapaSecundariaTransform = transforms.modelViewMatrix;
            mat4.translate(tapaSecundariaTransform, PanelesSolares.tuboSecundarioTransform, [0, 0, 0]);
            mat4.rotateX(tapaSecundariaTransform, tapaSecundariaTransform, Math.PI);
        }else if (this.alias === 'panelSolar1'){
            const planoTransform = transforms.modelViewMatrix;
            mat4.translate(planoTransform, PanelesSolares.tuboSecundarioTransform, [0, -dimensionesPanelSolar.largo/2, 0]);
            mat4.rotateX(planoTransform, planoTransform, -Math.PI/2);
            mat4.rotateZ(planoTransform, planoTransform, 2*Math.PI*anguloRotacionPanelSolar/360);

        } else if (this.alias === 'panelSolar2'){
            const planoTransform = transforms.modelViewMatrix;
            mat4.translate(planoTransform, PanelesSolares.tuboSecundarioTransform, [0,dimensionesTuboSecundario.altura + dimensionesPanelSolar.largo/2, 0]);
            mat4.rotateX(planoTransform, planoTransform, -Math.PI/2);
            mat4.rotateZ(planoTransform, planoTransform, 2*Math.PI*anguloRotacionPanelSolar/360);

        }
    }

    nucleoDelAnillo(){
        if (this.alias === 'nucleoAnillo') {
            Nave.naveTransform = transforms.modelViewMatrix
            Nucleo.nucleoAnilloTransform = transforms.modelViewMatrix
            mat4.translate(Nucleo.nucleoAnilloTransform, Nave.naveTransform, [0, 0, -Bloques.distanciaNucleoDelAnilloYNave])
            mat4.rotate(Nucleo.nucleoAnilloTransform,Nucleo.nucleoAnilloTransform , Math.PI/2, [1, 0, 0])

        }

        else if (this.alias === 'nucleoAnilloCilindroSup') {
            const nucleoAnilloCilindroSupTransform = transforms.modelViewMatrix;
            mat4.rotate(nucleoAnilloCilindroSupTransform, Nucleo.nucleoAnilloTransform, Math.PI / 2, [0, 1, 0]);
            mat4.translate(nucleoAnilloCilindroSupTransform, nucleoAnilloCilindroSupTransform, [0, dimensionesNucleoPS.altura, 0]);

        }else if (this.alias === 'nucleoAnilloCilindroInf') {
            const nucleoAnilloCilindroInfTransform = transforms.modelViewMatrix;
            mat4.rotate(nucleoAnilloCilindroInfTransform, Nucleo.nucleoAnilloTransform, -Math.PI/2, [0, 1, 0]);
            mat4.rotate(nucleoAnilloCilindroInfTransform, nucleoAnilloCilindroInfTransform, -Math.PI, [1, 0, 0]);
        }else if (this.alias === 'nucleoAnilloTapaSup') {
            const nucleoAnilloTapaSupTransform = transforms.modelViewMatrix;
            mat4.translate(nucleoAnilloTapaSupTransform, Nucleo.nucleoAnilloTransform, [0,
                dimensionesNucleoPS.altura + dimensionesCilindroNucleoPS.altura, 0]);

        }else if (this.alias === 'nucleoAnilloTapaInf') {
            const nucleoAnilloTapaInfTransform = transforms.modelViewMatrix;
            mat4.rotate(nucleoAnilloTapaInfTransform, Nucleo.nucleoAnilloTransform, Math.PI, [1, 0, 0]);
            mat4.translate(nucleoAnilloTapaInfTransform, nucleoAnilloTapaInfTransform, [0,
                dimensionesCilindroNucleoPS.altura, 0]);
        }
    }

    anillo(){
        if (this.alias === 'pastillaCuerpo') {


            const pastillaEnElMedio = 2-0.45;
            Anillo.pastillaTransform = transforms.modelViewMatrix;
            //cuando se descomente la linea de abajo, revisar las matrices de los transforms
             mat4.rotate(Anillo.pastillaTransform, Nucleo.nucleoAnilloTransform, Math.PI/2 * spherePosition/20, [0, 1, 0]);
            mat4.translate(Anillo.pastillaTransform, Anillo.pastillaTransform, [0, pastillaEnElMedio, 0]);

        } else if (this.alias === 'pastillaCilindroSup') {
            const pastillaCilindroSupTransform = transforms.modelViewMatrix;
            mat4.rotate(pastillaCilindroSupTransform, Anillo.pastillaTransform, Math.PI / 2, [0, 1, 0]);
            mat4.translate(pastillaCilindroSupTransform, pastillaCilindroSupTransform, [0, dimensionesPastillaCuerpo.altura, 0]);

        }else if (this.alias === 'pastillaCilindroInf') {
            const pastillaCilindroInfTransform = transforms.modelViewMatrix;
            mat4.rotate(pastillaCilindroInfTransform, Anillo.pastillaTransform, -Math.PI, [1, 0, 0]);
            mat4.rotate(pastillaCilindroInfTransform, pastillaCilindroInfTransform, Math.PI/2, [0, 1, 0]);

        }else if (this.alias === 'pastillaTapaSup') {
            const pastillaTapaSupTransform = transforms.modelViewMatrix;
            mat4.rotate(pastillaTapaSupTransform, Anillo.pastillaTransform, 0, [1, 0, 0]);
            mat4.translate(pastillaTapaSupTransform, pastillaTapaSupTransform, [0, Anillo.alturaTapaSuperior, 0]);

        }else if (this.alias === 'pastillaTapaInf') {
            const pastillaTapaInfTransform = transforms.modelViewMatrix;
            mat4.rotate(pastillaTapaInfTransform, Anillo.pastillaTransform, -Math.PI, [1, 0, 0]);
            mat4.translate(pastillaTapaInfTransform, pastillaTapaInfTransform, [0, Anillo.alturaTapaInferior, 0]);

        }
        else if(this.alias === 'torus'){ //ANILLO
            Anillo.torusTransform = transforms.modelViewMatrix;
            mat4.translate(Anillo.torusTransform, Anillo.pastillaTransform, [0, dimensionesPastillaCuerpo.altura/2,0]);
            mat4.rotate(Anillo.torusTransform, Anillo.torusTransform, Math.PI/2, [1, 0, 0]);
        }else if(this.alias === 'anillo_tuboH1') {
            const tuboH1Transform = transforms.modelViewMatrix;
            mat4.translate(tuboH1Transform, Anillo.torusTransform, [-distanciaEntreTubos, -dimTuboAnillo.altura/2, 0]);
        }else if(this.alias === 'anillo_tuboH2') {
            const tuboH2Transform = transforms.modelViewMatrix;
            mat4.translate(tuboH2Transform, Anillo.torusTransform, [distanciaEntreTubos, -dimTuboAnillo.altura/2, 0]);
        }else if(this.alias === 'anillo_tuboV1') {
            const tuboV1Transform = transforms.modelViewMatrix;
            mat4.translate(tuboV1Transform, Anillo.torusTransform, [dimTuboAnillo.altura/2, distanciaEntreTubos, 0]);
            mat4.rotate(tuboV1Transform, tuboV1Transform, Math.PI/2, [0,0,1]);
        }else if(this.alias === 'anillo_tuboV2') {
            const tuboV2Transform = transforms.modelViewMatrix;
            mat4.translate(tuboV2Transform, Anillo.torusTransform, [dimTuboAnillo.altura/2, -distanciaEntreTubos, 0]);
            mat4.rotate(tuboV2Transform, tuboV2Transform, Math.PI/2, [0,0,1]);
        }else if(this.alias === 'anillo_tuboInterior') {
            const tubointeriorTransform = transforms.modelViewMatrix;
            if(Anillo.desplazamientoTuboInterior < dimTuboAnillo.altura)
                mat4.translate(tubointeriorTransform, Anillo.torusTransform, [0, Anillo.distanciaTubosInteriores  - Anillo.desplazamientoTuboInterior, 0]);
            else
                mat4.translate(tubointeriorTransform, Anillo.torusTransform, [Anillo.factorDesplazamientoEntreTubosInteriores * Anillo.distanciaTubosInteriores - Anillo.desplazamientoTuboInterior, 0, 0]);

            mat4.rotate(tubointeriorTransform, tubointeriorTransform, Anillo.sentidoTuboInterior * Math.PI/4, [0,0,1]);
            mat4.translate(tubointeriorTransform, tubointeriorTransform, [0, -dimTuboInteriorAnillo.altura/2, 0]);
            Anillo.sentidoTuboInterior *= -1;
            Anillo.desplazamientoTuboInterior += distanciaEntreTubos*2
        }
    }
}

function draw() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    transforms.updatePerspective();

    try {
        gl.uniform1i(program.uUpdateLight, fixedLight);

        // Iterate over every object in the scene
        scene.traverse(object => {
            // Calculate local transformations
            transforms.calculateModelView();
            transforms.push();

            // Ubico las partes de la nave en la escena
            construir.setAlias(object.alias)

            //Dependiendo del objeto se aplica la transformacion


            //////////////////////////////////////////////////////////
            construir.nucleoDelPanelSolar()

            construir.panelesSolares()

            construir.nucleoDelAnillo()

            construir.anillo()

            construir.bloques()

            construir.modulosVioleta()
            ///////////////////////////////////////////
            transforms.setMatrixUniforms();
            transforms.pop();

            dibujarMallaDeObjeto(object)

        });
        //se resetea para el siguiente frame
        Bloques.posicionBloque = 0
        PanelesSolares.distanciaRelativaConElTuboPrincipal = 3.5
        Anillo.sentidoTuboInterior = 1
        Anillo.desplazamientoTuboInterior = 0

    }
    catch (error) {
        console.error(error);
    }
}

function dibujarMallaDeObjeto(object){
    gl.uniform4fv(program.uMaterialDiffuse, object.diffuse);
    gl.uniform4fv(program.uMaterialSpecular, object.specular);
    gl.uniform4fv(program.uMaterialAmbient, object.ambient);
    gl.uniform1i(program.uWireframe, object.wireframe);

    // Bind
    gl.bindVertexArray(object.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);


    // Draw
    if (object.wireframe) { //piso y axis con con gl.LINES
        gl.drawElements(gl.LINE_STRIP, object.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    else {
        const tipoDeDibujo = (triangleStrip) ? gl.TRIANGLE_STRIP : gl.TRIANGLES;
        gl.drawElements(tipoDeDibujo, object.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

}
// Update object positions
function animate() {
    spherePosition += dxSphere;

    if (spherePosition >= 100 || spherePosition <= -100) {
        dxSphere = -dxSphere;
    }
    conePosition += dxCone;
    if (conePosition >= 35 || conePosition <= -35) {
        dxCone = -dxCone;
    }

    draw();
}
frequency = 30
function onFrame() {
    elapsedTime = (new Date).getTime() - initialTime;
    if (elapsedTime < frequency) return; //no me sirve, intente de nuevo

    // console.log(elapsedTime)

    let steps = Math.floor(elapsedTime / frequency);
    console.log(steps)
    while (steps > 0) {
        animate();
        //draw()
        steps -= 1;
    }

    initialTime = (new Date).getTime();
}

function render() {
    initialTime = new Date().getTime();
    setInterval(onFrame, frequency / 1000);
}

function init() {
    configure();
    load();
    render();
    initControls();
}

window.onload = init;

function initControls() {
    utils.configureControls({
        'Camera Type': {
            value: camera.type,
            options: [Camera.ORBITING_TYPE, Camera.TRACKING_TYPE],
            onChange: v => {
                camera.goHome();
                camera.setType(v);
            }
        },
        'Bloques': {
            value: bloque.type,
            options: [Bloque.BLOQUES_4,Bloque.BLOQUES_5,Bloque.BLOQUES_6, Bloque.BLOQUES_7 ,Bloque.BLOQUES_8],
            onChange: v => {
                bloque.setType(v);
            }
        },
        'Paneles Solares Filas': {
            value: filasDeTubosSecundarios,
            min: 1, max: 10, step: 1,
            onChange: v => {
                removerPanelesSolares();
                filasDeTubosSecundarios = v;
                dimensionesTuboPrincipal.altura = filasDeTubosSecundarios * distanciaEntreTubosSecundarios + fc;
                cargarPanelesSolares();
            }
        },
        'Paneles Solares Angulo': {
            value: anguloRotacionPanelSolar,
            min: 0, max: 360, step: 1,
            onChange: v => anguloRotacionPanelSolar = v,
        },
        /*
        'Static Light Position': {
            value: fixedLight,
            onChange: v => fixedLight = v
        },

         */
        'Go Home': () => camera.goHome(),
        'Wireframe': () => {

            scene.traverse(object => {
               if (object.alias !== 'floor' && object.alias !== 'axis') {
                   object.wireframe = !wireframe;
                }

            })
            wireframe = !wireframe;
        },
        'Triangle Strip': {
        value: triangleStrip,
            onChange: v => triangleStrip = v
        },
    },{closed: false}
        );
}
function cargarYDescargarToro(){
    scene.remove('torus');
    scene.add(new Torus1("torus",radioDelAnillo, radioInteriorDelAnillo,dimensionesTriangulosTorus, arc))
}
/*
function initControls1() {
    utils.configureControls({
        'Light Color': {
            value: utils.denormalizeColor(lightColor),
            onChange: v => gl.uniform4fv(program.uLightDiffuse, utils.normalizeColor(v))
        },
        'Light Ambient Term': {
            value: lightAmbient[0],
            min: 0, max: 1, step: 0.01,
            onChange: v => gl.uniform4fv(program.uLightAmbient, [v, v, v, 1])
        },
        'Light Specular Term': {
            value: lightSpecular[0],
            min: 0, max: 1, step: 0.01,
            onChange: v => gl.uniform4fv(program.uLightSpecular, [v, v, v, 1])
        },
        // Spread all values from the reduce onto the controls
        ...['Translate X', 'Translate Y', 'Translate Z'].reduce((result, name, i) => {
            result[name] = {
                value: lightDirection[i],
                min: -10, max: 10, step: -0.1,
                onChange(v, state) {
                    gl.uniform3fv(program.uLightDirection, [
                        -state['Translate X'],
                        -state['Translate Y'],
                        state['Translate Z']
                    ]);
                }
            };
            return result;
        }, {}),
        'Sphere Color': {
            value: utils.denormalizeColor(materialDiffuse),
            onChange: v => gl.uniform4fv(program.uMaterialDiffuse, utils.normalizeColor(v))
        },
        'Material Ambient Term': {
            value: materialAmbient[0],
            min: 0, max: 1, step: 0.01,
            onChange: v => gl.uniform4fv(program.uMaterialAmbient, [v, v, v, 1])
        },
        'Material Specular Term': {
            value: materialSpecular[0],
            min: 0, max: 1, step: 0.01,
            onChange: v => gl.uniform4fv(program.uMaterialSpecular, [v, v, v, 1])
        },
        Shininess: {
            value: shininess,
            min: 0, max: 50, step: 0.1,
            onChange: v => gl.uniform1f(program.uShininess, v)
        },
        Background: {
            value: utils.denormalizeColor(clearColor),
            onChange: v => gl.clearColor(...utils.normalizeColor(v), 1)
        },
        Wireframe: {
            value: wireframe,
            onChange: v => wireframe = v
        }
    });
}

 */