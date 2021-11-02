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
import {Tubo, Tapa, Plano} from "./js/PanelesSolares";
//imoprt three js
import * as THREE from "three";


let
    gl, scene, program, camera, transforms,
    elapsedTime, initialTime,
    fixedLight = false,
    dxSphere = 0.1,
    dxCone = 0.15,
    spherePosition = 0,
    conePosition = 0,
    frequency = 5;

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
    camera.goHome([0, 2, 15]);
    camera.setFocus([0, 0, 0]);
    new Controls(camera, canvas);

    // Configure `transforms`
    transforms = new Transforms(gl, program, camera, canvas);

    gl.uniform3fv(program.uLightPosition, [15, 15, 0]);
    gl.uniform4fv(program.uLightAmbient, [0.2, 0.2, 0.2, 1]);
    gl.uniform4fv(program.uLightDiffuse, [1, 1, 1, 1]);
    gl.uniform4fv(program.uLightSpecular, [1, 1, 1, 1]);
    gl.uniform1f(program.uShininess, 230);
}
const distanciaEntreTubosSecundarios = 2
const filasTubosSecundarios = 4;
const fc = 2.15 //factor de correccion
const dimensionesTuboPrincipal = {
    radio: 0.15,
    altura: filasTubosSecundarios * distanciaEntreTubosSecundarios + fc,
}
const dimensionesTuboSecundario = {
    radio: 0.05,
    altura: 2.0,
}
const dimensionesPanelSolar = {
    ancho: 1.3,
    largo: 6,
}

// Load objects into our scene
function load() {
    scene.add(new Floor(80, 2));
    scene.add(new Axis(82));
    scene.add(new Tubo('tuboPrincipal', dimensionesTuboPrincipal))
    scene.add(new Tapa('tapa', dimensionesTuboPrincipal.radio))
    for (let i = 0; i < filasTubosSecundarios; i++) {
        scene.add(new Tubo('tuboSecundario', dimensionesTuboSecundario))
        scene.add( new Plano('panelSolar1', dimensionesPanelSolar))
        scene.add( new Plano('panelSolar2', dimensionesPanelSolar))
    }

}

function draw() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    transforms.updatePerspective();

    try {
        gl.uniform1i(program.uUpdateLight, fixedLight);

        let tuboTransform
        let tuboSecundarioTransform
        let distanciaRelativaConElTuboPrincipal = 3.5 //distancia con el nucleo
        // Iterate over every object in the scene
        scene.traverse(object => {
            // Calculate local transformations
            transforms.calculateModelView();
            transforms.push();

            // Depending on which object, apply transformation

            if (object.alias === 'tuboPrincipal') {

                tuboTransform = transforms.modelViewMatrix;
                mat4.translate(tuboTransform, tuboTransform, [0, 0, 0]);
                mat4.rotateX(tuboTransform, tuboTransform, Math.PI/2);

            }else if (object.alias === 'tapa') {


                const coneTransform = transforms.modelViewMatrix;
                mat4.translate(coneTransform, tuboTransform, [0, dimensionesTuboPrincipal.altura, 0]);


            }else if(object.alias === 'tuboSecundario'){

                tuboSecundarioTransform = transforms.modelViewMatrix;
                mat4.translate(tuboSecundarioTransform, tuboTransform, [dimensionesTuboSecundario.altura/2,distanciaRelativaConElTuboPrincipal, 0]);
                mat4.rotateZ(tuboSecundarioTransform, tuboSecundarioTransform, Math.PI/2);
                distanciaRelativaConElTuboPrincipal+=distanciaEntreTubosSecundarios

            }else if (object.alias === 'panelSolar1'){
                const planoTransform = transforms.modelViewMatrix;
                mat4.translate(planoTransform, tuboSecundarioTransform, [0, -dimensionesPanelSolar.largo/2, 0]);
                mat4.rotateX(planoTransform, planoTransform, -Math.PI/2);
            } else if (object.alias === 'panelSolar2'){
                const planoTransform = transforms.modelViewMatrix;
                mat4.translate(planoTransform, tuboSecundarioTransform, [0,dimensionesTuboSecundario.altura + dimensionesPanelSolar.largo/2, 0]);
                mat4.rotateX(planoTransform, planoTransform, -Math.PI/2);
        }

            transforms.setMatrixUniforms();
            transforms.pop();

            dibujarMallaDeObjeto(object)

        });
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
    if (object.wireframe) {
        gl.drawElements(gl.LINE_STRIP, object.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    else {
        gl.drawElements(gl.TRIANGLE_STRIP, object.indices.length, gl.UNSIGNED_SHORT, 0);
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
        'Static Light Position': {
            value: fixedLight,
            onChange: v => fixedLight = v
        },
        'Go Home': () => camera.goHome()
    });
}