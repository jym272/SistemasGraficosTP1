'use strict';
import './style.css'
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
    Cilindro, Superficie,
} from "./js/Superficies";
import {
    Forma,
    TapaSuperficieParametrica,
    SuperficieParametrica,
} from "./js/SuperficiesDeBarrido";
import {CurvaCubicaDeBezier} from "./js/CurvasDeBezier";
import {DroneCameraControl} from "./js/droneCamara";


let
    gl, scene, program, camera, transforms, transformar, bloque, panelSolar, controles, droneCam,
    targetNave, targetPanelesSolares, //focus de la nave y los paneles en el cual se enfoca la camara
    elapsedTime, initialTime,
    fixedLight = false,
    triangleStrip = true,
    wireframe = false,
    ajuste = 8,  //para ajustar posiciones de los objetos, se usa en el diseño
    dxAnillo = 0.01,
    posicionAnillo = 0, //anima la rotacion del anillo
    intervaloEnGradosAnimacionesPanelSolar = 30,
    animarPaneles = true,
    lightPosition = [0, 5, 12],
    animationRate; //ms

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
    camera.goTo( [0,0,40],  0,  0, [0,0,0])
    droneCam = new DroneCameraControl([0,0,-10], camera);
    controles = new Controls(camera, canvas, droneCam);

    // Configure `transforms`
    transforms = new Transforms(gl, program, camera, canvas);

    gl.uniform3fv(program.uLightPosition, lightPosition);
    gl.uniform4fv(program.uLightAmbient, [0.2, 0.2, 0.2, 1]);
    gl.uniform4fv(program.uLightDiffuse, [1, 1, 1, 1]);
    gl.uniform4fv(program.uLightSpecular, [1, 1, 1, 1]);
    gl.uniform1f(program.uShininess, 230);

    //Transformaciones afines
    transformar = new TransformacionesAfin(new AnimacionPanelesSolares(300, intervaloEnGradosAnimacionesPanelSolar));
}
/*
 * COLORES
 */
const colorPastilla = [169/255, 183/255, 43/255, 1];
const colorPanelSolar = [0,40/255,166/255,1];
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
const dimensionesPanelSolarLado = {
    ancho: 0.1,
    largo: 1.3,
}
const dimensionesPanelSolarLadoLargo = {
    ancho: 0.1,
    largo: 6,
}
const dimensionesTriangulosTubo = {
    filas: 1,
    columnas: 10,
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
    columnas: 8,
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
    columnas : 30, //segmentosDeAltura
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

// Se carga todos los objetos a la escena
function load() {
    scene.add(new Floor(80, 2));
    scene.add(new Axis(82));

    const nave = new Superficie(null, 'nave')
    scene.add(nave)
    cargarNucleo()
    panelSolar = new PanelSolar()
    cargarPanelesSolares()
    cargarAnillo()
    bloque = new Bloque(Bloque.BLOQUES_4)
    moduloVioleta()
    cargarEsfera()
    cargarCapsula()


}
class PanelSolar{
    constructor() {
        this.panelesEnEscena = []
        this.construirComponentes()
    }
    construirComponentes(){
        this.componentes = []
        /*
         * Construccion del panelSolar
         */

        const tapaSuperior = new Plano('panelTapaSuperior', dimensionesPanelSolar, dimensionesTriangulosPlano)
        tapaSuperior.diffuse = colorPanelSolar;
        this.componentes.push(tapaSuperior)

        const tapaInferior = new Plano('panelTapaInferior', dimensionesPanelSolar, dimensionesTriangulosPlano)
        tapaInferior.diffuse = colorPanelSolar;

        this.componentes.push(tapaInferior)

        this.componentes.push(new Plano('panelLadoA', dimensionesPanelSolarLado, dimensionesTriangulosPlano))

        this.componentes.push(new Plano('panelLadoA1', dimensionesPanelSolarLado, dimensionesTriangulosPlano))

        this.componentes.push(new Plano('panelLadoB', dimensionesPanelSolarLadoLargo, dimensionesTriangulosPlano))

        this.componentes.push(new Plano('panelLadoB1', dimensionesPanelSolarLadoLargo, dimensionesTriangulosPlano))

    }
    nuevo(alias){
        const nuevoPanel = []
        /*
         * Abstraccion del panelSolar
         */
        nuevoPanel.push(new Superficie(null, alias))
        nuevoPanel.push(...this.componentes)
        this.agregarALaEscena(nuevoPanel)
        this.panelesEnEscena.push(nuevoPanel)
    }
    agregarALaEscena(nuevoPanel){
        nuevoPanel.forEach(componente => {
            scene.add(componente)
        })
    }
    removerParPaneles(unPar =2) {
        let i = 0
        if (this.panelesEnEscena.length < unPar)
            console.error('No hay mas paneles para remover');
        else {
            while (i < unPar) {
                this.panelesEnEscena.pop().forEach(componente => {
                    scene.remove(componente.alias)
                })
                i++
            }
        }
    }
}
function cargarCapsula(){
    /*
     *Capsula
     *->Cola de la capsula construida con curva de bezier como forma y con un recorrido
     *  colapsado circular con radio cero ---> Sup de revolucion
     *->El recorrido va ser circular con radio 0, mientras mas puntos pasoDiscretoRecorrido
     *  mas se parece a una circunferencia en lugar de un poligono -> tomar en cuenta para la tapa
     */
    const pasoDiscretoRecorrido = 30
    const divisionesForma = 10 //precision en la forma,
    //Azul Polenta [0,4/255,1,1],
    const arraycolores=[
        [247,144/255,0/255,1],//fuegoCuerpo
        [247,90/255,0/255,1],//capsulaCola
        [247,19/255,0/255,1],//fuegoCola
    ]
    const dimensionesCapsulaCilindro = {
        filas : 1, //segmentosRadiales
        columnas : pasoDiscretoRecorrido, //segmentosDeAltura
    };
    /*
     * Abstraccion de la capsula
     * -> transformando la matriz relacionada de este objeto muevo a la capsula
     */
    const capsula = new Superficie(null, 'capsula')
    scene.add(capsula)

    /*
     *Cola
     */
    Capsula.curvaColav0x = -1.99
    const curvaCola = new CurvaCubicaDeBezier(
        [Capsula.curvaColav0x,0.78],
        [-1.2,0.785],
        [-0.66,0.52],
        [-0.14,0.18]
    );

    const puntosBezierCola = curvaCola.extraerPuntos(divisionesForma)
    const datosDeLaForma ={
        puntos : puntosBezierCola.puntos,
        normales : puntosBezierCola.puntosTangentes.map(p =>{
            return [-p[1], p[0]]}),
    }


    //Creo una Superficie de Revolucion
    const pasoDiscretoForma = datosDeLaForma.puntos.length-1
    const dimensiones = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }

    //Klave para la sup de Rev -> radio 0
    const datosDelRecorrido = crearRecorridoCircular(0, 1, dimensiones["filas"])

    const capsulaCola = new SuperficieParametrica("capsulaCola", datosDeLaForma, datosDelRecorrido, dimensiones, true)
    scene.add(capsulaCola,{
        diffuse: arraycolores[1],
    });

    const capsulaFuegoCola = (new Cilindro('capsulaFuegoCola', {
        radioSuperior: 0.78,
        radioInferior: 0.05,
        altura: 0.5,
    }, dimensionesCapsulaCilindro, true))
    scene.add(capsulaFuegoCola,{
        diffuse: arraycolores[2],
    });


    /*
     * Cuerpo de la Capsula
     */
    const curvaCuerpo = new CurvaCubicaDeBezier(
        [0.3,1.5],
        [1.185,1.44],
        [1.844,1.185],
        [2.5,0.7]
    );
    const puntosBezierCuerpo = curvaCuerpo.extraerPuntos(divisionesForma)

    const datosDeLaFormaCuerpo ={
        puntos : puntosBezierCuerpo.puntos,
        normales : puntosBezierCuerpo.puntosTangentes.map(p =>{
            return [-p[1], p[0]]}),
    }

    //Creo una Superficie de Revolucion
    const pasoDiscretoCuerpo = datosDeLaFormaCuerpo.puntos.length-1
    const dimensionesCuerpo = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoCuerpo, //divisiones de la forma
    }
    const cuerpo = new SuperficieParametrica("capsulaCuerpoBezierA", datosDeLaFormaCuerpo, datosDelRecorrido, dimensionesCuerpo, true)
    scene.add(cuerpo)

    Capsula.CilAaltura = 0.1
    const capsulaCuerpoCilindroA = (new Cilindro('capsulaCuerpoCilindroA', {
        radioSuperior: 0.4,
        radioInferior: 1.2,
        altura: Capsula.CilAaltura,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroA)

    const capsulaCuerpoCilindroB = (new Cilindro('capsulaCuerpoCilindroB', {
        radioSuperior: 1.2,
        radioInferior: 1.5,
        altura: 0.2,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroB)

    const capsulaCuerpoCilindroC = (new Cilindro('capsulaCuerpoCilindroC', {
        radioSuperior: 0.7,
        radioInferior: 0.6,
        altura: 0.01,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroC)

    const capsulaCuerpoCilindroD = (new Cilindro('capsulaCuerpoCilindroD', {
        radioSuperior: 0.6,
        radioInferior: 0.4,
        altura: 2.9-2.51,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroD, {diffuse: colorGenerico})

    const capsulaCuerpoCilindroE = (new Cilindro('capsulaCuerpoCilindroE', {
        radioSuperior: 0.4,
        radioInferior: 0,
        altura: 0.001,
    }, dimensionesCapsulaCilindro))
    scene.add(capsulaCuerpoCilindroE)

    Capsula.FuegoCuerpoAltura =0.5;
    const capsulaFuegoCuerpo = (new Cilindro('capsulaFuegoCuerpo', {
        radioSuperior: 1.2,
        radioInferior: 0.05,
        altura: Capsula.FuegoCuerpoAltura ,
    }, dimensionesCapsulaCilindro, true))
    scene.add(capsulaFuegoCuerpo,{
        diffuse: arraycolores[0],
    });

}
function cargarEsfera(){
    //Creo una Superficie de Revolucion

    //El recorrido va ser circular con radio 0, mientras mas puntos mas se parece a
    //una circunferencia en lugar de un poligono -> tomar en cuenta para la tapa
    const pasoDiscretoRecorrido = 30
    const divisionesForma = 20 //precision en la forma,
    ///////////////////////////////////////////////////////////////////
    const porcionDeCircunferencia = 2/8 //la forma va de pi/4 a (pi-pi/4) -> 25% del circulo
    const radio = Esfera.radio //2
                    //reutilizo la funcion para crear una forma circular
    const forma = crearRecorridoCircular(radio, porcionDeCircunferencia, divisionesForma)

    //rotar los puntos del recorrido x,y 45 grados
    const angulo =Esfera.angulo     //Math.PI/4 //tengo que rotar, los puntos obtenidos parten de cero
    //los pts me sirven, las binormales, le quito la z y son las normales
    const datosDeLaForma ={
        puntos : forma.puntos.map(punto => {
            return  [
                punto[0] * Math.cos(angulo) - punto[1] * Math.sin(angulo),
                punto[0] * Math.sin(angulo) + punto[1] * Math.cos(angulo)
            ]
        }),
        normales : forma.binormales.map(punto => {
            return  [
                punto[0] * Math.cos(angulo) - punto[1] * Math.sin(angulo),
                punto[0] * Math.sin(angulo) + punto[1] * Math.cos(angulo)
            ]
        })
    }

    const pasoDiscretoForma = datosDeLaForma.puntos.length-1
    const dimensiones = {
        filas: pasoDiscretoRecorrido, //paso discreto del recorrido
        columnas: pasoDiscretoForma, //divisiones de la forma
    }

                                                //Klave para la sup de Rev
    const datosDelRecorrido = crearRecorridoCircular(0, 1, dimensiones["filas"])

    const nuevaSup = new SuperficieParametrica("esfera", datosDeLaForma, datosDelRecorrido, dimensiones, true)
    scene.add(nuevaSup)

    scene.add(new Tapa('esferaTapaAtras', radio*Math.sin(angulo), {
        filas : 1, //segmentosRadiales
        columnas : pasoDiscretoRecorrido, //segmentosDeAltura
    }), {
        diffuse: colorGenerico,
    });

    scene.add(new Tapa('esferaTapaAdelante', radio*Math.sin(angulo), {
        filas : 1, //segmentosRadiales
        columnas : pasoDiscretoRecorrido, //segmentosDeAltura
    }), {
        diffuse: colorGenerico,
    });
}
function crearRecorridoCircular(radio,porcion, divisiones){

    const phi = 2*Math.PI *porcion

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
    constructor(type = Bloque.BLOQUES_8, pasoDiscretoRecorrido = 30, divisionesForma = 8) {

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
        dimensiones["filas"] = pasoDiscretoRecorrido -20
        const datosDelRecorridoBloque1= crearRecorridoCircular(radioDelAnillo, Bloque1, dimensiones["filas"])
        //dimensiones["filas"] = pasoDiscretoRecorrido
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
        dimensiones["filas"] = pasoDiscretoRecorrido -10
        const datosDelRecorridoBloque5= crearRecorridoCircular(radioDelAnillo, Bloque5, dimensiones["filas"])
        this.dictionary[Bloque.BLOQUES_5].push( new SuperficieParametrica("bloque5", datosDeLaForma, datosDelRecorridoBloque5, dimensiones, true))

        dimensiones["filas"] = pasoDiscretoRecorrido -20
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

            this.removerBloqueActualDeLaEscena();

            this.actualizarEscena()
    }
    removerBloqueActualDeLaEscena(){
        if(this.bloqueActual != null)
            this.bloqueActual.forEach(item => {
                scene.remove(item.alias)
            });
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
    const divisionesForma = 8

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
        panelSolar.removerParPaneles()
    }
}

function cargarPanelesSolares(){
    scene.add(new Tubo('tuboPrincipal', dimensionesTuboPrincipal, dimensionesTriangulosTubo))
    scene.add(new Tapa('tapaPrincipal', dimensionesTuboPrincipal.radio, dimensionesTriangulosTapa))

    for (let i = 0; i < filasDeTubosSecundarios; i++) {
        scene.add(new Tubo('tuboSecundario', dimensionesTuboSecundario, dimensionesTriangulosTubo))
        scene.add(new Tapa('tapaSecundaria1', dimensionesTuboSecundario.radio, dimensionesTriangulosTapa))
        scene.add(new Tapa('tapaSecundaria2', dimensionesTuboSecundario.radio, dimensionesTriangulosTapa))

        panelSolar.nuevo('panelSolar1')
        panelSolar.nuevo('panelSolar2')
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
    panelTransform : null,
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
    bloqueTransform : null, //la reutilizo para todos los bloques ya que solo puedo exisitir un tipo de bloque a la vez
    centrarElBloque : 0.42,

    distanciaNucleoDelAnilloYNave : dimensionesNucleoPS.altura + dimensionesCilindroNucleoPS.altura,
    distanciaModuloVioletaYNave : dimensionesNucleoPS.altura + 2*dimensionesCilindroNucleoPS.altura +profundidadModuloVioleta,
    posicionBloque : 0,
}
const Esfera = {
    esferaTransform : null,
    radio :2,
    angulo: Math.PI/4,
    posRelativaALaNave: 8.8,
}
const Capsula = {
    capsulaTransform : null,
}

class AnimacionPanelesSolares{
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
    animar(anguloRad){
        const anguloEntero = utils.deRadianesAGrados(anguloRad);

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
            anguloRotacionPanelSolar * (1 - INTERVALO_RANDOM_A) :
            anguloRotacionPanelSolar * (1 + INTERVALO_RANDOM_B)

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
        const intervalo= anguloRotacionPanelSolar - nuevoAngulo;

        let diffAngular;

        if(velocidadDeGiro !== 0 ){
            diffAngular = intervalo / velocidadDeGiro
            // console.log("la diff angular:", diffAngular)
            if(Math.abs(diffAngular) > 0.02) {
                anguloRotacionPanelSolar -= diffAngular;

                if (anguloEnProceso === nuevoAngulo) {

                    this.timeOutIdPool.push(setTimeout(() => {
                         // console.log("nuevo", nuevoAngulo, anguloRotacionPanelSolar)
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

class TransformacionesAfin{
    constructor(animacionPanelesSolares) {
        this.paramAnillo = {
            pastillaEnElMedio : 2 - 0.45,
            factorDeVelocidad: 5,
        };
        this.animacionPanelesSolares = animacionPanelesSolares;
    }
    setAlias(alias){
        this.alias = alias;
    }

    capsula(){
        if(this.alias === 'capsula'){

            Capsula.capsulaTransform = transforms.modelViewMatrix

            const {
                rotationMatrix,
                position,
            } = droneCam.update()

            controles.setFocusCapsula(position) //evita un parpadeo en la camara
            if(controles.focusCamera.Capsula === true){
                camera.setFocus(position)
            }

            //se envia el mismo objeto rotatioMatrix, talves sea mejor enviar una copia,
            //por ahora todo bien, si se envia una copia se tendria que hacer una copia de la matriz en cada draw
            camera.setRotationMatrix(rotationMatrix)



            /*

            console.log(`rotMatrix:
            ${rotationMatrix[0].toFixed(2)}, ${rotationMatrix[1].toFixed(2)}, ${rotationMatrix[2].toFixed(2)}, ${rotationMatrix[3].toFixed(2)}, '\n'
            ${rotationMatrix[4].toFixed(2)}, ${rotationMatrix[5].toFixed(2)}, ${rotationMatrix[6].toFixed(2)}, ${rotationMatrix[7].toFixed(2)}, '\n'
            ${rotationMatrix[8].toFixed(2)}, ${rotationMatrix[9].toFixed(2)}, ${rotationMatrix[10].toFixed(2)}, ${rotationMatrix[11].toFixed(2)}, '\n'
            ${rotationMatrix[12].toFixed(2)}, ${rotationMatrix[13].toFixed(2)}, ${rotationMatrix[14].toFixed(2)}, ${rotationMatrix[15].toFixed(2)}
            `);

            console.log(`camMatrix:
            ${camera.matrix[0].toFixed(2)}, ${camera.matrix[1].toFixed(2)}, ${camera.matrix[2].toFixed(2)}, ${camera.matrix[3].toFixed(2)}, '\n'
            ${camera.matrix[4].toFixed(2)}, ${camera.matrix[5].toFixed(2)}, ${camera.matrix[6].toFixed(2)}, ${camera.matrix[7].toFixed(2)}, '\n'
            ${camera.matrix[8].toFixed(2)}, ${camera.matrix[9].toFixed(2)}, ${camera.matrix[10].toFixed(2)}, ${camera.matrix[11].toFixed(2)}, '\n'
            ${camera.matrix[12].toFixed(2)}, ${camera.matrix[13].toFixed(2)}, ${camera.matrix[14].toFixed(2)}, ${camera.matrix[15].toFixed(2)}
            `);


             */


            mat4.translate(Capsula.capsulaTransform,Capsula.capsulaTransform,position);
            mat4.multiply(Capsula.capsulaTransform,Capsula.capsulaTransform,rotationMatrix);
            //mat4.translate(Capsula.capsulaTransform, Capsula.capsulaTransform, posicionRespectoLaNave);
           mat4.rotate(Capsula.capsulaTransform, Capsula.capsulaTransform, Math.PI, [1, 0, 0]);


        }else if(this.alias === 'capsulaCuerpoCilindroA') {
            const capsulaCuerpoCilindroATransform = transforms.modelViewMatrix;

            mat4.translate(capsulaCuerpoCilindroATransform, Capsula.capsulaTransform, [0, 0, 0.1]);
            mat4.rotate(capsulaCuerpoCilindroATransform, capsulaCuerpoCilindroATransform, -Math.PI/2,[1, 0, 0]);

        }else if(this.alias === 'capsulaCuerpoCilindroB') {
            const capsulaCuerpoCilindroBTransform = transforms.modelViewMatrix;

            mat4.translate(capsulaCuerpoCilindroBTransform, Capsula.capsulaTransform , [0, 0, 0.3]);
            mat4.rotate(capsulaCuerpoCilindroBTransform, capsulaCuerpoCilindroBTransform, -Math.PI/2,[1, 0, 0]);
        }else if(this.alias === 'capsulaCuerpoBezierA') {

            const capsulaCuerpoBezierATransform = transforms.modelViewMatrix;
            mat4.rotate(capsulaCuerpoBezierATransform, Capsula.capsulaTransform , Math.PI / 2, [0, 0, 1]);
        }else if(this.alias === 'capsulaCuerpoCilindroC') {

            const capsulaCuerpoCilindroCTransform = transforms.modelViewMatrix;
            mat4.translate(capsulaCuerpoCilindroCTransform, Capsula.capsulaTransform , [0, 0, 2.51]);

            mat4.rotate(capsulaCuerpoCilindroCTransform, capsulaCuerpoCilindroCTransform, -Math.PI/2,[1, 0, 0]);
        }else if(this.alias === 'capsulaCuerpoCilindroD') {

            const capsulaCuerpoCilindroDTransform = transforms.modelViewMatrix;
            mat4.translate(capsulaCuerpoCilindroDTransform, Capsula.capsulaTransform , [0, 0, 2.9]);

            mat4.rotate(capsulaCuerpoCilindroDTransform, capsulaCuerpoCilindroDTransform, -Math.PI/2,[1, 0, 0]);
        }else if(this.alias === 'capsulaCuerpoCilindroE') {

            const capsulaCuerpoCilindroETransform = transforms.modelViewMatrix;
            mat4.translate(capsulaCuerpoCilindroETransform, Capsula.capsulaTransform , [0, 0, 2.9 +0.001]);

            mat4.rotate(capsulaCuerpoCilindroETransform, capsulaCuerpoCilindroETransform, -Math.PI/2,[1, 0, 0]);
        }else if(this.alias === 'capsulaCola'){

            const capsulaColaTransform = transforms.modelViewMatrix;
            mat4.translate(capsulaColaTransform, Capsula.capsulaTransform , [0, 0, 0.2]);
        }else if(this.alias === 'capsulaFuegoCola') {

            const capsulaCuerpoFuegoColaTransform = transforms.modelViewMatrix;
            mat4.rotate(capsulaCuerpoFuegoColaTransform, Capsula.capsulaTransform , -Math.PI/2,[0, 0, 1]);
            mat4.translate(capsulaCuerpoFuegoColaTransform, capsulaCuerpoFuegoColaTransform, [0, 0, (Capsula.curvaColav0x+0.5) +0.2]);
            mat4.rotate(capsulaCuerpoFuegoColaTransform, capsulaCuerpoFuegoColaTransform, -Math.PI/2,[1, 0, 0]);
        }else if(this.alias === 'capsulaFuegoCuerpo') {

            const capsulaCuerpoFuegoColaTransform = transforms.modelViewMatrix;
            mat4.translate(capsulaCuerpoFuegoColaTransform, Capsula.capsulaTransform , [0, 0, Capsula.CilAaltura +  Capsula.FuegoCuerpoAltura]);
            mat4.rotate(capsulaCuerpoFuegoColaTransform, capsulaCuerpoFuegoColaTransform, -Math.PI/2,[1, 0, 0]);
        }


    }

    esfera(){
        if(this.alias === 'esfera'){
            Esfera.esferaTransform = transforms.modelViewMatrix;
            mat4.translate(Esfera.esferaTransform, Nave.naveTransform, [0, 0,-Esfera.posRelativaALaNave]);
        }else if (this.alias ===  'esferaTapaAtras'){
            const esferaTapaAtrasTransform = transforms.modelViewMatrix;
            mat4.translate(esferaTapaAtrasTransform, Esfera.esferaTransform, [0, 0, Esfera.radio*Math.cos(Esfera.angulo)]);
            mat4.rotate(esferaTapaAtrasTransform, esferaTapaAtrasTransform, Math.PI/2, [1,0,0]);
        }else if (this.alias ===  'esferaTapaAdelante'){
            const esferaTapaAdenlanteTransform = transforms.modelViewMatrix;
            mat4.translate(esferaTapaAdenlanteTransform, Esfera.esferaTransform, [0, 0, -Esfera.radio*Math.cos(Esfera.angulo)]);
            mat4.rotate(esferaTapaAdenlanteTransform, esferaTapaAdenlanteTransform, Math.PI/2, [-1,0,0]);
        }
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
            const moduloVioletaPSTransform = transforms.modelViewMatrix
            mat4.translate(moduloVioletaPSTransform, Nave.naveTransform, [0, 0, 0])

        } else if (this.alias === 'moduloVioletaAnillo') {
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
            PanelesSolares.panelTransform = transforms.modelViewMatrix;
            mat4.translate(PanelesSolares.panelTransform, PanelesSolares.tuboSecundarioTransform, [0, -dimensionesPanelSolar.largo/2, 0]);
            mat4.rotateX(PanelesSolares.panelTransform, PanelesSolares.panelTransform, -Math.PI/2);
            mat4.rotateZ(PanelesSolares.panelTransform, PanelesSolares.panelTransform, 2*Math.PI*anguloRotacionPanelSolar/360);

        } else if (this.alias === 'panelSolar2'){
            PanelesSolares.panelTransform = transforms.modelViewMatrix;
            mat4.translate(PanelesSolares.panelTransform, PanelesSolares.tuboSecundarioTransform, [0,dimensionesTuboSecundario.altura + dimensionesPanelSolar.largo/2, 0]);
            mat4.rotateX(PanelesSolares.panelTransform, PanelesSolares.panelTransform, -Math.PI/2);
            mat4.rotateZ(PanelesSolares.panelTransform, PanelesSolares.panelTransform, 2*Math.PI*anguloRotacionPanelSolar/360);

        }else if(this.alias === 'panelTapaSuperior'){
            const panelTapaSuperiorTransform = transforms.modelViewMatrix;
            mat4.translate(panelTapaSuperiorTransform, PanelesSolares.panelTransform,[0, dimensionesPanelSolarLado.ancho, 0]);
        }else if(this.alias === 'panelTapaInferior'){
            const panelTapaInferiorTransform = transforms.modelViewMatrix;
            mat4.rotate(panelTapaInferiorTransform, PanelesSolares.panelTransform, Math.PI,[1, 0, 0]);

        }else if(this.alias === 'panelLadoA'){
            const panelLadoATransform = transforms.modelViewMatrix;
            mat4.translate(panelLadoATransform, PanelesSolares.panelTransform,[0, dimensionesPanelSolarLado.ancho/2, dimensionesPanelSolar.largo/2]);

            mat4.rotate(panelLadoATransform, panelLadoATransform, Math.PI/2,[0, 0, 1]);
            mat4.rotate(panelLadoATransform, panelLadoATransform, Math.PI,[0, 1, 1]);

        }else if(this.alias === 'panelLadoA1'){
            const panelLadoA1Transform = transforms.modelViewMatrix;
            mat4.translate(panelLadoA1Transform, PanelesSolares.panelTransform,[0, dimensionesPanelSolarLado.ancho/2, -dimensionesPanelSolar.largo/2]);

            mat4.rotate(panelLadoA1Transform, panelLadoA1Transform, Math.PI/2,[1, 0, 0]);
            mat4.rotate(panelLadoA1Transform, panelLadoA1Transform, -Math.PI,[1, 0, 1]);

        }else if(this.alias === 'panelLadoB') {
            const panelLadoBTransform = transforms.modelViewMatrix;
            mat4.translate(panelLadoBTransform, PanelesSolares.panelTransform, [dimensionesPanelSolarLado.largo / 2, dimensionesPanelSolarLado.ancho/2, 0]);

            mat4.rotate(panelLadoBTransform, panelLadoBTransform, Math.PI, [1, 1, 0]);
        }
        else if(this.alias === 'panelLadoB1') {
            const panelLadoB1Transform = transforms.modelViewMatrix;
            mat4.translate(panelLadoB1Transform, PanelesSolares.panelTransform, [-dimensionesPanelSolarLado.largo / 2, dimensionesPanelSolarLado.ancho/2, 0]);
            mat4.rotate(panelLadoB1Transform, panelLadoB1Transform, -Math.PI, [0, 0, 1]);
            mat4.rotate(panelLadoB1Transform, panelLadoB1Transform, -Math.PI, [1,1 , 0]);
        }
    }

    nucleoDelAnillo(){
        if (this.alias === 'nucleoAnillo') {
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

            Anillo.pastillaTransform = transforms.modelViewMatrix;
            const anguloRad = posicionAnillo/this.paramAnillo.factorDeVelocidad

            mat4.rotate(Anillo.pastillaTransform, Nucleo.nucleoAnilloTransform,  anguloRad, [0, 1, 0]);
            mat4.translate(Anillo.pastillaTransform, Anillo.pastillaTransform, [0, this.paramAnillo.pastillaEnElMedio, 0]);
            if(animarPaneles)
                this.animacionPanelesSolares.animar(anguloRad)

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

            //Actualizo el wireframe
            if (object.alias !== 'floor' && object.alias !== 'axis') {
                object.wireframe = wireframe;
            }
            // Ubico las partes de la nave en la escena
            transformar.setAlias(object.alias)

            //Dependiendo del objeto se aplica la transformacion
            if(object.alias === 'nave'){
                Nave.naveTransform = transforms.modelViewMatrix;
                /*
                const radio = 45
                const factorVelocidad = 60;
                const phi = 2*Math.PI * posicionAnillo/factorVelocidad
                const x = radio * Math.sin(phi)
                const z = radio * Math.cos(phi)
                const target = [x, 0, z]
                mat4.translate(Nave.naveTransform, Nave.naveTransform,  target);

                //que la nave gire conforme la tangente del recorrido target
                mat4.rotate(Nave.naveTransform, Nave.naveTransform, phi + Math.PI/2, [0,1,0]);


                 */

                targetNave = [0,0,0] //es el vector de posicion de la nave resultante de una futura matriz de transformacion

                //los paneles solares son relativos a la nave, los configuro tambien ahora.
                targetPanelesSolares =  [0,0,15.5];//[0,0,dimensionesTuboPrincipal.altura]                    //10.15

                //actualizo el foco de la camara en los controles, evita un parpadeo
                //cunado cambio las camaras, los target no se mueven pero en el futuro podrian hacerlo
                controles.setFocus(targetNave, targetPanelesSolares)

                if(controles.focusCamera.Nave === true){
                    camera.setFocus(targetNave)
                }else
                if(controles.focusCamera.PanelesSolares === true){
                    camera.setFocus(targetPanelesSolares)
                }


/*

                //obtener la posicion de Nave.naveTransform respecto al mundo
                const posicionNave = vec3.create();
                vec3.transformMat4(posicionNave, [0,0,0], Nave.naveTransform);
                //log posicionNave con 2 decimales en x, y z
                console.log(`posNave: ${posicionNave[0].toFixed(2)}, ${posicionNave[1].toFixed(2)}, ${posicionNave[2].toFixed(2)}`);

                //obtener la posiciones de la transformacion de la camara respecto al mundo
                const posicionCamara = vec3.create();
                vec3.transformMat4(posicionCamara, [0,0,0], camera.getViewTransform());
                //log posicionCamara con 2 decimales en x, y z
                console.log(`posCamara: ${posicionCamara[0].toFixed(2)}, ${posicionCamara[1].toFixed(2)}, ${posicionCamara[2].toFixed(2)}`);

 */
            }
          //////////////////////////////////////////////////////////
            transformar.nucleoDelPanelSolar()

            transformar.panelesSolares()

            transformar.nucleoDelAnillo()

            transformar.anillo()

            transformar.bloques()

            transformar.modulosVioleta()

            transformar.esfera()

            transformar.capsula()
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
        (object.alias === 'floor' || object.alias === 'axis') ?
            gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0) :
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

function animate() {
    posicionAnillo += dxAnillo;
    draw();
}
animationRate = 30
function onFrame() {
    elapsedTime = (new Date).getTime() - initialTime;
    if (elapsedTime < animationRate) return; //no me sirve, intente de nuevo

    let steps = Math.floor(elapsedTime / animationRate);
    while (steps > 0) {
        animate();
        steps -= 1;
    }

    initialTime = (new Date).getTime();
}

function render() {
    initialTime = new Date().getTime();
    setInterval(onFrame, animationRate / 1000);
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
/*
        'Camera Type': {
            value: camera.type,
            options: [Camera.ORBITING_TYPE, Camera.TRACKING_TYPE],
            onChange: v => {
               camera.goHome();
                camera.setType(v);
            }
        },

 */

        'Bloques': {
            value: bloque.type,
            options: [Bloque.BLOQUES_4,Bloque.BLOQUES_5,Bloque.BLOQUES_6, Bloque.BLOQUES_7 ,Bloque.BLOQUES_8],
            onChange: v => {
                bloque.setType(v);
            }
        },

        'PanelesSolares': {
            'Filas': {
                value: filasDeTubosSecundarios,
                min: 1, max: 10, step: 1,
                onChange: v => {
                    removerPanelesSolares();
                    filasDeTubosSecundarios = v;
                    dimensionesTuboPrincipal.altura = filasDeTubosSecundarios * distanciaEntreTubosSecundarios + fc;
                    //evita el parpadeo de la camara
                    /* ahora uso un foco estatico
                    targetPanelesSolares =  [0,0,dimensionesTuboPrincipal.altura]
                    if(controles.focusCamera.PanelesSolares === true){
                        camera.setFocus(targetPanelesSolares)
                    }

                     */
                    cargarPanelesSolares();
                }
            },
            'Angulo': {
                value: anguloRotacionPanelSolar,
                min: 0, max: 360, step: 1,
                onChange: v => anguloRotacionPanelSolar = v,
            },
            'AnimarPaneles': {
                value: animarPaneles,
                onChange: v => animarPaneles = v
            },
            'IntervaloAnimacion': {
                value: intervaloEnGradosAnimacionesPanelSolar,
                min: 15, max: 45, step: 15,
                onChange: v => intervaloEnGradosAnimacionesPanelSolar = v,
            },
        },
/*
        'Ajuste' : {
            value: ajuste,
            min: 0, max: 3, step: 0.1,
            onChange: v => ajuste = v,
        },


 */

/*
        'Static Light Position': {
            value: fixedLight,
            onChange: v => fixedLight = v
        },

 */

        //'Go Home': () => camera.goHome(),
        'Wireframe': () => {
            wireframe = !wireframe;
        },
        'Triangle Strip': {
        value: triangleStrip,
            onChange: v => triangleStrip = v
        },
    },{closed: false}
        );
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