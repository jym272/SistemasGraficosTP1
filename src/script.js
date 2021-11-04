'use strict';
import './style.css'
import {utils} from './js/utils';
import {mat4, vec3} from "gl-matrix";
import {Program} from "./js/Program";
import {Clock} from "./js/Clock";
import {Scene} from "./js/Scene";
import {Floor} from "./js/Floor";
import {Axis} from "./js/Axis";
import {Camera} from "./js/Camera";
import {Controls} from "./js/Controls";
import {Transforms} from "./js/Transforms";
import {Tubo, Tapa, Plano, Torus, Tubo1, Cilindro} from "./js/PanelesSolares";



let
    gl, scene, program, camera, transforms,
    elapsedTime, initialTime,
    fixedLight = false,
    triangleStrip = true,
    wireframe = false,
    dxSphere = 0.1,
    dxCone = 0.15,
    spherePosition = 0,
    conePosition = 0,
    frequency = 5; //ms

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
    camera.goHome([0, 0, 24]);
    camera.setFocus([0, 0, 0]);
    new Controls(camera, canvas);

    // Configure `transforms`
    transforms = new Transforms(gl, program, camera, canvas);

    gl.uniform3fv(program.uLightPosition, [0, 8, 24]);
    gl.uniform4fv(program.uLightAmbient, [0.2, 0.2, 0.2, 1]);
    gl.uniform4fv(program.uLightDiffuse, [1, 1, 1, 1]);
    gl.uniform4fv(program.uLightSpecular, [1, 1, 1, 1]);
    gl.uniform1f(program.uShininess, 230);
}
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
    filas: 10, //segmentosTubulares   //para el deploy 30
    columnas: 20, //segmentosRadiales  //para el deploy 80
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
// Se carga todos los objetos a la escena

//var pasajeras
const dimensionesPastillaCuerpo = {
    radio : 2.50,
    altura: 0.8,
};
const dimensionesCilindro = {
    radioSuperior: 2.30,
    radioInferior: dimensionesPastillaCuerpo.radio,
    altura: 0.10,
};
const dimensionesTriangulos = {
    filas : 1, //segmentosRadiales
    columnas : 50, //segmentosDeAltura
};

function load() {
    scene.add(new Floor(80, 2));
    scene.add(new Axis(82));
    cargarAnillo()
    cargarPanelesSolares()
    scene.add(new Tubo('pastillaCuerpo', dimensionesPastillaCuerpo, dimensionesTriangulos))
    scene.add(new Cilindro('pastillaCilindroSup', dimensionesCilindro, dimensionesTriangulos))
    scene.add(new Cilindro('pastillaCilindroInf', dimensionesCilindro, dimensionesTriangulos))
    scene.add(new Tapa('pastillaTapaSup', dimensionesCilindro.radioSuperior, dimensionesTriangulos))
    scene.add(new Tapa('pastillaTapaInf', dimensionesCilindro.radioSuperior, dimensionesTriangulos))


}



function cargarAnillo(){
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

        scene.add( new Plano('panelSolar1', dimensionesPanelSolar, dimensionesTriangulosPlano))
        scene.add( new Plano('panelSolar2', dimensionesPanelSolar, dimensionesTriangulosPlano))
    }
}

function draw() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    transforms.updatePerspective();

    try {
        gl.uniform1i(program.uUpdateLight, fixedLight);

        const PanelesSolares= {
            tuboTransform : null,
            tuboSecundarioTransform : null,
            distanciaRelativaConElTuboPrincipal : 3.5,
        }
        const Anillo = {
            torusTransform : transforms.modelViewMatrix, //momentario sino null es para los segmentos del menu
            distanciaTubosInteriores : radioDelAnillo,
            sentidoTuboInterior : 1,
            desplazamientoTuboInterior : 0,
            factorDesplazamientoEntreTubosInteriores: 3,
            //pastilla
            pastillaTransform : null,
            alturaTapaSuperior : 0.9,
            alturaTapaInferior : 0.1,
        }
        // Iterate over every object in the scene
        scene.traverse(object => {
            // Calculate local transformations
            transforms.calculateModelView();
            transforms.push();

            // Depending on which object, apply transformation:
            if (object.alias === 'pastillaCuerpo') {
                Anillo.pastillaTransform = transforms.modelViewMatrix;
                mat4.rotate(Anillo.pastillaTransform, Anillo.torusTransform, Math.PI / 2, [1, 0, 0]);
                mat4.translate(Anillo.pastillaTransform, Anillo.pastillaTransform, [0, -dimensionesPastillaCuerpo.altura/2, 0]);

            } else if (object.alias === 'pastillaCilindroSup') {
                const pastillaCilindroSupTransform = transforms.modelViewMatrix;
                mat4.rotate(pastillaCilindroSupTransform, Anillo.pastillaTransform, Math.PI / 2, [0, 1, 0]);
                mat4.translate(pastillaCilindroSupTransform, pastillaCilindroSupTransform, [0, dimensionesPastillaCuerpo.altura, 0]);

            }else if (object.alias === 'pastillaCilindroInf') {
                const pastillaCilindroInfTransform = transforms.modelViewMatrix;
               mat4.rotate(pastillaCilindroInfTransform, Anillo.pastillaTransform, -Math.PI, [1, 0, 0]);
               mat4.rotate(pastillaCilindroInfTransform, pastillaCilindroInfTransform, Math.PI/2, [0, 1, 0]);

            }else if (object.alias === 'pastillaTapaSup') {
                const pastillaTapaSupTransform = transforms.modelViewMatrix;
                mat4.rotate(pastillaTapaSupTransform, Anillo.pastillaTransform, 0, [1, 0, 0]);
                mat4.translate(pastillaTapaSupTransform, pastillaTapaSupTransform, [0, Anillo.alturaTapaSuperior, 0]);

            }else if (object.alias === 'pastillaTapaInf') {
                const pastillaTapaInfTransform = transforms.modelViewMatrix;
                mat4.rotate(pastillaTapaInfTransform, Anillo.pastillaTransform, -Math.PI, [1, 0, 0]);
                mat4.translate(pastillaTapaInfTransform, pastillaTapaInfTransform, [0, Anillo.alturaTapaInferior, 0]);
            }



                if(object.alias === 'torus'){
                Anillo.torusTransform = transforms.modelViewMatrix;
             //mat4.rotate(Anillo.torusTransform, Anillo.torusTransform, Math.PI/2, [1,0, 0]);
            }else if(object.alias === 'anillo_tuboH1') {
                const tuboH1Transform = transforms.modelViewMatrix;
                mat4.translate(tuboH1Transform, Anillo.torusTransform, [-distanciaEntreTubos, -dimTuboAnillo.altura/2, 0]);
            }else if(object.alias === 'anillo_tuboH2') {
                const tuboH2Transform = transforms.modelViewMatrix;
                mat4.translate(tuboH2Transform, Anillo.torusTransform, [distanciaEntreTubos, -dimTuboAnillo.altura/2, 0]);
            }else if(object.alias === 'anillo_tuboV1') {
                const tuboV1Transform = transforms.modelViewMatrix;
                mat4.translate(tuboV1Transform, Anillo.torusTransform, [dimTuboAnillo.altura/2, distanciaEntreTubos, 0]);
                mat4.rotate(tuboV1Transform, tuboV1Transform, Math.PI/2, [0,0,1]);
            }else if(object.alias === 'anillo_tuboV2') {
                const tuboV2Transform = transforms.modelViewMatrix;
                mat4.translate(tuboV2Transform, Anillo.torusTransform, [dimTuboAnillo.altura/2, -distanciaEntreTubos, 0]);
                mat4.rotate(tuboV2Transform, tuboV2Transform, Math.PI/2, [0,0,1]);
            }else if(object.alias === 'anillo_tuboInterior') {
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
            transformacionesPanelesSolares(object.alias, PanelesSolares);


            ///////////////////////////////////////////
            transforms.setMatrixUniforms();
            transforms.pop();

            dibujarMallaDeObjeto(object)

        });
    }
    catch (error) {
        console.error(error);
    }
}
function transformacionesPanelesSolares(alias,ps){

    if (alias === 'tuboPrincipal') {

        ps.tuboTransform = transforms.modelViewMatrix;
        mat4.translate(ps.tuboTransform, ps.tuboTransform, [0, 0, 0]);
        mat4.rotateX(ps.tuboTransform, ps.tuboTransform, Math.PI/2);
    }else if (alias === 'tapaPrincipal') {

        const tapaPrincipalTransform = transforms.modelViewMatrix;
        mat4.translate(tapaPrincipalTransform, ps.tuboTransform, [0, dimensionesTuboPrincipal.altura, 0]);

    }else if(alias === 'tuboSecundario'){

        ps.tuboSecundarioTransform = transforms.modelViewMatrix;
        mat4.translate(ps.tuboSecundarioTransform, ps.tuboTransform, [dimensionesTuboSecundario.altura/2,ps.distanciaRelativaConElTuboPrincipal, 0]);
        mat4.rotateZ(ps.tuboSecundarioTransform, ps.tuboSecundarioTransform, Math.PI/2);
        ps.distanciaRelativaConElTuboPrincipal+=distanciaEntreTubosSecundarios

    }else if (alias === 'tapaSecundaria1'){
        const tapaSecundariaTransform = transforms.modelViewMatrix;
        mat4.translate(tapaSecundariaTransform, ps.tuboSecundarioTransform, [0, dimensionesTuboSecundario.altura, 0]);
    }else if (alias === 'tapaSecundaria2'){
        const tapaSecundariaTransform = transforms.modelViewMatrix;
        mat4.translate(tapaSecundariaTransform, ps.tuboSecundarioTransform, [0, 0, 0]);
        mat4.rotateX(tapaSecundariaTransform, tapaSecundariaTransform, Math.PI);
    }else if (alias === 'panelSolar1'){
        const planoTransform = transforms.modelViewMatrix;
        mat4.translate(planoTransform, ps.tuboSecundarioTransform, [0, -dimensionesPanelSolar.largo/2, 0]);
        mat4.rotateX(planoTransform, planoTransform, -Math.PI/2);
        mat4.rotateZ(planoTransform, planoTransform, 2*Math.PI*anguloRotacionPanelSolar/360);

    } else if (alias === 'panelSolar2'){
        const planoTransform = transforms.modelViewMatrix;
        mat4.translate(planoTransform, ps.tuboSecundarioTransform, [0,dimensionesTuboSecundario.altura + dimensionesPanelSolar.largo/2, 0]);
        mat4.rotateX(planoTransform, planoTransform, -Math.PI/2);
        mat4.rotateZ(planoTransform, planoTransform, 2*Math.PI*anguloRotacionPanelSolar/360);

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

    if (spherePosition >= 30 || spherePosition <= -30) {
        dxSphere = -dxSphere;
    }

    conePosition += dxCone;
    if (conePosition >= 35 || conePosition <= -35) {
        dxCone = -dxCone;
    }

    draw();
}

function onFrame() {
    elapsedTime = (new Date).getTime() - initialTime;
    if (elapsedTime < frequency) return;

    let steps = Math.floor(elapsedTime / frequency);
    while (steps > 0) {
        //animate();
        draw()
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
        'Static Light Position': {
            value: fixedLight,
            onChange: v => fixedLight = v
        },
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
        'Arco Toro': {
            value: arc,
            min:0, max:360, step:1,
            onChange: v => {
                arc = v * Math.PI * 2 / 360;
                cargarYDescargarToro();
            }
        },
        'Seg tubulares': {
            value: dimensionesTriangulosTorus.filas,
            min:0, max:100, step:1,
            onChange: v => {
                dimensionesTriangulosTorus.filas = v;
                cargarYDescargarToro();
            }
        },
        'Seg radiales': {
            value: dimensionesTriangulosTorus.columnas,
            min:0, max:100, step:1,
            onChange: v => {
                dimensionesTriangulosTorus.columnas = v;
                cargarYDescargarToro();
            }
        },
    });
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