import {Bloque} from "./Bloque";
import {mat4, vec3, vec4} from "gl-matrix";
import {dimensiones} from "./dimensiones";

/*
 * Matrices para las Transformaciones
 */
export const Bloques = {
    bloqueTransform: null, //la reutilizo para todos los bloques ya que solo puedo exisitir un tipo de bloque a la vez
    centrarElBloque: 0.42,

    distanciaNucleoDelAnilloYNave: dimensiones.NucleoPS.altura + dimensiones.CilindroNucleoPS.altura,
    distanciaModuloVioletaYNave: dimensiones.NucleoPS.altura + 2 * dimensiones.CilindroNucleoPS.altura + dimensiones.profundidadModuloVioleta,
    posicionBloque: 0,
}

export const Anillo = {
    torusTransform: null, //transforms.modelViewMatrix, //momentario sino null es para los segmentos del menu
    distanciaTubosInteriores: dimensiones.anillo.radio,
    sentidoTuboInterior: 1,
    desplazamientoTuboInterior: 0,
    factorDesplazamientoEntreTubosInteriores: 3,
    //pastilla
    pastillaTransform: null,
    alturaTapaSuperior: 0.9,
    alturaTapaInferior: 0.1,
}

export const Nucleo = {
    nucleoPSTransform: null,
    nucleoAnilloTransform: null,
}

export const Capsula = {
    capsulaTransform: null,
    spotLights:{
        red:{
            position: [0.65,0,-2.48],
            diffuse: [1,0,0,1],
            translateFactor : [0.65,0,2.48],
        },
        green:{
            position : [-0.65,0,-2.48],
            diffuse: [0,1,0,1],
            translateFactor : [-0.65,0,2.48],
        },
        direction : [0,0,-1],
        scaleFactor: [0.1,0.26,0.18],
        blanca: {
            diffuse: [1,1,1,1],
        },
    },
}

export const Nave = { //abstraccion de la nave
    naveTransform: null, // es como el cero
}

export const PanelesSolares = {
    tuboTransform: null,
    tuboSecundarioTransform: null,
    distanciaRelativaConElTuboPrincipal: 3.5, //se tiene que resetear luego de dibujar todos los paneles
    distanciaConElNucleo: 4.5,
    panelTransform: null,
}

export const Esfera = {
    esferaTransform: null,
    radio: 2,
    angulo: Math.PI / 4,
    posRelativaALaNave: 8.8,
}

export const Cubo = {
    transform: null,
    lado: 5
}

export const Teatro = {
    transform: null,
}

export class TransformacionesAfin {

    constructor(transforms, droneCam, controles, camera, bloque, animacion, lights, spotLight) {
        this.spotLight = spotLight;
        this.lights = lights;
        this.animacion = animacion;
        this.bloque = bloque;
        this.transforms = transforms;
        this.droneCam = droneCam;
        this.controles = controles;
        this.camera = camera;
        this.paramAnillo = {
            pastillaEnElMedio: 2 - 0.45,
            factorDeVelocidad: 5,
        };
        this.panelSolar = {
            anguloRotacion: 310,
            animar: true,
            posicion1 :[0, -dimensiones.panelSolar.tapa.largo / 2, 0],
            posicion2 :[0, dimensiones.panelSolar.tuboSecundario.altura + dimensiones.panelSolar.tapa.largo / 2, 0],
        }
        this.posicionAnillo = 0;
        this.cargarParametrosBloques();
        this.cuboTransform = transforms.modelViewMatrix;
        this.cargarParametrosMundo();
        this.ajuste = 0.0;
    }

    cargarParametrosMundo() {
        this.tierraLunaTransform = [
            {
                tierra: {
                    x: 904,
                    y: -939,
                    z: 1554,
                    rx: 0.87,
                    ry: 4.89,
                    rz: 3.73,
                    radio: 1405
                },
                luna: {
                    x: 525,
                    y: 850,
                    z: -722,
                    rx: 1.96,
                    ry: 1.08,
                    rz: 0,
                    radio: 345
                }
            },
            {
                tierra: {
                    x: -1101,
                    y: -1047,
                    z: 1392,
                    rx: 1.49,
                    ry: 4.01,
                    rz: 3.39,
                    radio: 1405
                },
                luna: {
                    x: 1283,
                    y: -17,
                    z: -180,
                    rx: 1.42,
                    ry: 2.78,
                    rz: 5.98,
                    radio: 345
                }
            },
            {
                tierra: {
                    x: -2131,
                    y: -939,
                    z: 741,
                    rx: 0.4,
                    ry: 1.89,
                    rz: 1.83,
                    radio: 1405
                },
                luna: {
                    x: 796,
                    y: 145,
                    z: 1066,
                    rx: 0.87,
                    ry: 0.67,
                    rz: 2.57,
                    radio: 345
                }
            },
        ]
    }

    cargarParametrosBloques() {
        let anguloPos = 360;
        let cantBloques = 8;
        this.parametrosBloques = {}
        Bloque.TYPES.forEach(item => {
                this.parametrosBloques[item] = {
                    anguloPosicion: anguloPos,
                    anguloTapaAtras: 180 / cantBloques--
                }
                anguloPos -= 45;

            }
        );
    }

    setAlias(alias) {
        this.alias = alias;
    }

    capsula() {
        const {transforms, droneCam, controles, camera} = this;
        if (this.alias === 'capsula') {
            Capsula.capsulaTransform = transforms.modelViewMatrix

            const {
                rotationMatrix,
                position,
            } = droneCam.update()
            //Se actualizar la posicion de las luces
            const greenPosition = vec3.create();
            const redPosition = vec3.create();

            vec3.set(greenPosition, ...Capsula.spotLights.green.position);
            vec3.set(redPosition, ...Capsula.spotLights.red.position);
            const worldDroneCamMatrix = droneCam.getMatrix()
            vec3.transformMat4(redPosition, redPosition, worldDroneCamMatrix);
            vec3.transformMat4(greenPosition, greenPosition, worldDroneCamMatrix);

            this.spotLight.cambiarDireccionCon(rotationMatrix)
            this.lights.get('redLight').setPosition([redPosition[0], redPosition[1], redPosition[2]]);
            this.lights.get('greenLight').setPosition([greenPosition[0], greenPosition[1], greenPosition[2]]);

            controles.setFocusCapsula(position) //evita un parpadeo en la camara
            if (controles.focusCamera.Capsula === true) {
                camera.setFocus(position)
            }

            //se envia el mismo objeto rotatioMatrix, talves sea mejor enviar una copia,
            //por ahora todo bien, si se envia una copia se tendria que hacer una copia de la matriz en cada draw
            camera.setRotationMatrix(rotationMatrix)


console.log('position:', position[0].toFixed(2), position[1].toFixed(2), position[2].toFixed(2))

            console.log(`rotMatrix:
            ${rotationMatrix[0].toFixed(2)}, ${rotationMatrix[1].toFixed(2)}, ${rotationMatrix[2].toFixed(2)}, ${rotationMatrix[3].toFixed(2)}, '\n'
            ${rotationMatrix[4].toFixed(2)}, ${rotationMatrix[5].toFixed(2)}, ${rotationMatrix[6].toFixed(2)}, ${rotationMatrix[7].toFixed(2)}, '\n'
            ${rotationMatrix[8].toFixed(2)}, ${rotationMatrix[9].toFixed(2)}, ${rotationMatrix[10].toFixed(2)}, ${rotationMatrix[11].toFixed(2)}, '\n'
            ${rotationMatrix[12].toFixed(2)}, ${rotationMatrix[13].toFixed(2)}, ${rotationMatrix[14].toFixed(2)}, ${rotationMatrix[15].toFixed(2)}
            `);

            /*


         console.log(`camMatrix:
         ${camera.matrix[0].toFixed(2)}, ${camera.matrix[1].toFixed(2)}, ${camera.matrix[2].toFixed(2)}, ${camera.matrix[3].toFixed(2)}, '\n'
         ${camera.matrix[4].toFixed(2)}, ${camera.matrix[5].toFixed(2)}, ${camera.matrix[6].toFixed(2)}, ${camera.matrix[7].toFixed(2)}, '\n'
         ${camera.matrix[8].toFixed(2)}, ${camera.matrix[9].toFixed(2)}, ${camera.matrix[10].toFixed(2)}, ${camera.matrix[11].toFixed(2)}, '\n'
         ${camera.matrix[12].toFixed(2)}, ${camera.matrix[13].toFixed(2)}, ${camera.matrix[14].toFixed(2)}, ${camera.matrix[15].toFixed(2)}
         `);


          */

            // mat4.translate(Capsula.capsulaTransform, Capsula.capsulaTransform, position);
            mat4.multiply(Capsula.capsulaTransform, Capsula.capsulaTransform, worldDroneCamMatrix);
            mat4.rotate(Capsula.capsulaTransform, Capsula.capsulaTransform, Math.PI, [1, 0, 0]);


        }else if (this.alias === 'capsulaCola') {

            const capsulaColaTransform = transforms.modelViewMatrix;
            mat4.translate(capsulaColaTransform, Capsula.capsulaTransform, [0, 0, 0.2]);
        } else if (this.alias === 'capsulaFuegoCola') {

            const capsulaCuerpoFuegoColaTransform = transforms.modelViewMatrix;
            mat4.rotate(capsulaCuerpoFuegoColaTransform, Capsula.capsulaTransform, -Math.PI / 2, [0, 0, 1]);
            mat4.translate(capsulaCuerpoFuegoColaTransform, capsulaCuerpoFuegoColaTransform, [0, 0, (Capsula.curvaColav0x + 0.5) + 0.2]);
            mat4.rotate(capsulaCuerpoFuegoColaTransform, capsulaCuerpoFuegoColaTransform, -Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'capsulaFuegoCuerpo') {
            const capsulaCuerpoFuegoColaTransform = transforms.modelViewMatrix;
            mat4.translate(capsulaCuerpoFuegoColaTransform, Capsula.capsulaTransform, [0, 0, Capsula.CilAaltura + Capsula.FuegoCuerpoAltura]);
            mat4.rotate(capsulaCuerpoFuegoColaTransform, capsulaCuerpoFuegoColaTransform, -Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'redLight'){
            const blueLightTransform = transforms.modelViewMatrix;
            mat4.translate(blueLightTransform, Capsula.capsulaTransform, Capsula.spotLights.red.translateFactor);
            mat4.scale(blueLightTransform, blueLightTransform, Capsula.spotLights.scaleFactor);
        }else if (this.alias === 'greenLight'){
            const greenLightTransform = transforms.modelViewMatrix;
            mat4.translate(greenLightTransform, Capsula.capsulaTransform, Capsula.spotLights.green.translateFactor);
            mat4.scale(greenLightTransform, greenLightTransform, Capsula.spotLights.scaleFactor);
        }


    }

    esfera() {
        const {transforms} = this;
        if (this.alias === 'esfera') {
            Esfera.esferaTransform = transforms.modelViewMatrix;
            mat4.translate(Esfera.esferaTransform, Nave.naveTransform, [0, 0, -Esfera.posRelativaALaNave]);
        }
    }

    bloques() {
        const {bloque, transforms} = this;
        const tipoDeBloque = bloque.dameElTipoDeBloqueActual()
        const p = this.parametrosBloques[tipoDeBloque]
        if (this.alias === 'bloque') {
            Bloques.bloqueTransform = transforms.modelViewMatrix
            const angulo = (22.5 + 90 * Bloques.posicionBloque) * Math.PI / p.anguloPosicion
            mat4.rotate(Bloques.bloqueTransform, Anillo.pastillaTransform, angulo, [0, 1, 0])
            mat4.translate(Bloques.bloqueTransform, Bloques.bloqueTransform, [0, Bloques.centrarElBloque, 0])
            mat4.rotate(Bloques.bloqueTransform, Bloques.bloqueTransform, Math.PI / 2, [1, 0, 0])
            Bloques.posicionBloque++
        }
    }

    modulosVioleta() {
        const {transforms} = this;
        if (this.alias === 'moduloVioletaPS') {
            const moduloVioletaPSTransform = transforms.modelViewMatrix
            mat4.translate(moduloVioletaPSTransform, Nave.naveTransform, [0, 0, 0])

        } else if (this.alias === 'moduloVioletaAnillo') {
            const moduloVioletaAnilloTransform = transforms.modelViewMatrix
            mat4.translate(moduloVioletaAnilloTransform, Nave.naveTransform, [0, 0,
                -Bloques.distanciaModuloVioletaYNave])
        }

    }

    nucleoDelPanelSolar() {
        const {transforms} = this;
        const distanciaModuloVioleta = dimensiones.profundidadModuloVioleta + dimensiones.CilindroNucleoPS.altura

        if (this.alias === 'nucleoPS') {
            Nucleo.nucleoPSTransform = transforms.modelViewMatrix;
            mat4.translate(Nucleo.nucleoPSTransform, Nave.naveTransform, [0, 0, distanciaModuloVioleta]);
            mat4.rotate(Nucleo.nucleoPSTransform, Nucleo.nucleoPSTransform, Math.PI / 2, [1, 0, 0]);
        }
    }

    panelesSolares() {
        const {transforms} = this;
        if (this.alias === 'tuboPrincipal') {  //CONEXION CON EL NUCLEOPS

            PanelesSolares.tuboTransform = transforms.modelViewMatrix;
            mat4.translate(PanelesSolares.tuboTransform, Nucleo.nucleoPSTransform, [0, PanelesSolares.distanciaConElNucleo, 0]);
            // mat4.rotateX(ps.tuboTransform, ps.tuboTransform, Math.PI/2); //puedo rotar todo
            //  El tubo principal ACAAA
        } else if (this.alias === 'tapaPrincipal') {

            const tapaPrincipalTransform = transforms.modelViewMatrix;
            mat4.translate(tapaPrincipalTransform, PanelesSolares.tuboTransform, [0, dimensiones.panelSolar.tuboPrincipal.altura, 0]);

        } else if (this.alias === 'tuboSecundario') {

            PanelesSolares.tuboSecundarioTransform = transforms.modelViewMatrix;
            mat4.translate(PanelesSolares.tuboSecundarioTransform, PanelesSolares.tuboTransform, [dimensiones.panelSolar.tuboSecundario.altura / 2, PanelesSolares.distanciaRelativaConElTuboPrincipal, 0]);
            mat4.rotateZ(PanelesSolares.tuboSecundarioTransform, PanelesSolares.tuboSecundarioTransform, Math.PI / 2);
            PanelesSolares.distanciaRelativaConElTuboPrincipal += dimensiones.panelSolar.distanciaEntreTubosSecundarios;

        }
/*
        else if (this.alias === 'tapaSecundaria1') {
            const tapaSecundariaTransform = transforms.modelViewMatrix;
            mat4.translate(tapaSecundariaTransform, PanelesSolares.tuboSecundarioTransform, [0, dimensiones.panelSolar.tuboSecundario.altura, 0]);
        } else if (this.alias === 'tapaSecundaria2') {
            const tapaSecundariaTransform = transforms.modelViewMatrix;
            mat4.translate(tapaSecundariaTransform, PanelesSolares.tuboSecundarioTransform, [0, 0, 0]);
            mat4.rotateX(tapaSecundariaTransform, tapaSecundariaTransform, Math.PI);
        }

 */


        else if (this.alias === 'panelSolar1' || this.alias === 'panelSolar2') {
            PanelesSolares.panelTransform = transforms.modelViewMatrix;
            (this.alias ==='panelSolar1')?
                mat4.translate(PanelesSolares.panelTransform, PanelesSolares.tuboSecundarioTransform, this.panelSolar.posicion1):
                mat4.translate(PanelesSolares.panelTransform, PanelesSolares.tuboSecundarioTransform, this.panelSolar.posicion2);
            mat4.rotateX(PanelesSolares.panelTransform, PanelesSolares.panelTransform, -Math.PI / 2);
            mat4.rotateZ(PanelesSolares.panelTransform, PanelesSolares.panelTransform, 2 * Math.PI * this.panelSolar.anguloRotacion / 360);
            mat4.translate(PanelesSolares.panelTransform, PanelesSolares.panelTransform, [0,-dimensiones.panelSolar.tuboSecundario.radio, 0]);
        }
    }

    nucleoDelAnillo() {
        const {transforms} = this;
        if (this.alias === "nucleoAnillo") {
            Nucleo.nucleoAnilloTransform = transforms.modelViewMatrix
            mat4.translate(Nucleo.nucleoAnilloTransform, Nave.naveTransform, [0, 0, -Bloques.distanciaNucleoDelAnilloYNave])
            mat4.rotate(Nucleo.nucleoAnilloTransform, Nucleo.nucleoAnilloTransform, Math.PI / 2, [1, 0, 0])
        }
    }

    animarAnillo(diferencial) {
        this.posicionAnillo += diferencial;

    }

    anillo() {
        const {transforms, posicionAnillo, animacion} = this;
        if (this.alias === 'pastillaCuerpo') {

            Anillo.pastillaTransform = transforms.modelViewMatrix;
            const anguloRad = posicionAnillo / this.paramAnillo.factorDeVelocidad

            mat4.rotate(Anillo.pastillaTransform, Nucleo.nucleoAnilloTransform, anguloRad, [0, 1, 0]);
            mat4.translate(Anillo.pastillaTransform, Anillo.pastillaTransform, [0, this.paramAnillo.pastillaEnElMedio, 0]);

            if (this.panelSolar.animar) //la animacion del panel solar esta vinculada con el anillo
                animacion.empezarEn(anguloRad, this.panelSolar)
            else
                animacion.limpiarElPool()

        }else if (this.alias === 'torus') { //ANILLO
            Anillo.torusTransform = transforms.modelViewMatrix;
            mat4.translate(Anillo.torusTransform, Anillo.pastillaTransform, [0, dimensiones.pastillas.cuerpo.altura / 2, 0]);
            mat4.rotate(Anillo.torusTransform, Anillo.torusTransform, Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'anillo_tuboH1') {
            const tuboH1Transform = transforms.modelViewMatrix;
            mat4.translate(tuboH1Transform, Anillo.torusTransform, [-dimensiones.anillo.distanciaEntreTubos, -dimensiones.anillo.tubo.altura / 2, 0]);
        } else if (this.alias === 'anillo_tuboH2') {
            const tuboH2Transform = transforms.modelViewMatrix;
            mat4.translate(tuboH2Transform, Anillo.torusTransform, [dimensiones.anillo.distanciaEntreTubos, -dimensiones.anillo.tubo.altura / 2, 0]);
        } else if (this.alias === 'anillo_tuboV1') {
            const tuboV1Transform = transforms.modelViewMatrix;
            mat4.translate(tuboV1Transform, Anillo.torusTransform, [dimensiones.anillo.tubo.altura / 2, dimensiones.anillo.distanciaEntreTubos, 0]);
            mat4.rotate(tuboV1Transform, tuboV1Transform, Math.PI / 2, [0, 0, 1]);
        } else if (this.alias === 'anillo_tuboV2') {
            const tuboV2Transform = transforms.modelViewMatrix;
            mat4.translate(tuboV2Transform, Anillo.torusTransform, [dimensiones.anillo.tubo.altura / 2, -dimensiones.anillo.distanciaEntreTubos, 0]);
            mat4.rotate(tuboV2Transform, tuboV2Transform, Math.PI / 2, [0, 0, 1]);
        } else if (this.alias === 'anillo_tuboInterior') {
            const tubointeriorTransform = transforms.modelViewMatrix;
            if (Anillo.desplazamientoTuboInterior < dimensiones.anillo.tubo.altura)
                mat4.translate(tubointeriorTransform, Anillo.torusTransform, [0, Anillo.distanciaTubosInteriores - Anillo.desplazamientoTuboInterior, 0]);
            else
                mat4.translate(tubointeriorTransform, Anillo.torusTransform, [Anillo.factorDesplazamientoEntreTubosInteriores * Anillo.distanciaTubosInteriores - Anillo.desplazamientoTuboInterior, 0, 0]);

            mat4.rotate(tubointeriorTransform, tubointeriorTransform, Anillo.sentidoTuboInterior * Math.PI / 4, [0, 0, 1]);
            mat4.translate(tubointeriorTransform, tubointeriorTransform, [0, -dimensiones.anillo.tuboInterior.altura / 2, 0]);
            Anillo.sentidoTuboInterior *= -1;
            Anillo.desplazamientoTuboInterior += dimensiones.anillo.distanciaEntreTubos * 2
        }
    }

    luna() {
        const {transforms, mundo, controles, camera} = this;
        if (this.alias === 'luna') {
            const lunaTransform = transforms.modelViewMatrix;


            /*
            const x = dimensiones.ajusteLuna.coordenadas[0]
            const y = dimensiones.ajusteLuna.coordenadas[1]
            const z = dimensiones.ajusteLuna.coordenadas[2]

            const rx = dimensiones.ajusteLuna.rotacion[0]
            const ry = dimensiones.ajusteLuna.rotacion[1]
            const rz = dimensiones.ajusteLuna.rotacion[2]

            const radio = dimensiones.ajusteLuna.radio




            mat4.translate(lunaTransform, lunaTransform, [x, y, z]);
            mat4.scale(lunaTransform, lunaTransform, [radio, radio, radio]);
            mat4.rotateX(lunaTransform, lunaTransform, rx);
            mat4.rotateZ(lunaTransform, lunaTransform, ry);
            mat4.rotateY(lunaTransform, lunaTransform, rz);


             */

            const targetLuna = [mundo.luna.x, mundo.luna.y, mundo.luna.z] //mundo.luna.position
            //actualizo el foco de la camara en los controles, evita un parpadeo
            //cunado cambio las camaras, los target no se mueven pero en el futuro podrian hacerlo
            controles.setFocusLuna(targetLuna)

            if (controles.focusCamera.Luna === true) {
                camera.setFocus(targetLuna)
            }
            const anguloRad = this.posicionAnillo / 20 // dividido para un factor de velocidad, el angulo se hace mas pequeño

            mat4.translate(lunaTransform, lunaTransform, targetLuna);
            mat4.rotate(lunaTransform, lunaTransform, anguloRad, [0, 1, 0]);

            // mat4.scale(lunaTransform, lunaTransform, [mundo.luna.radio, mundo.luna.radio, mundo.luna.radio]);
            mat4.rotateX(lunaTransform, lunaTransform, mundo.luna.rx);
            mat4.rotateZ(lunaTransform, lunaTransform, mundo.luna.ry);
            mat4.rotateY(lunaTransform, lunaTransform, mundo.luna.rz);


        }
    }

    tierra() {
        const {transforms, mundo, camera, controles} = this;
        if (this.alias === 'tierra') {
            const tierraTransform = transforms.modelViewMatrix;



            /*
            const x = dimensiones.ajusteTierra.coordenadas[0]
            const y = dimensiones.ajusteTierra.coordenadas[1]
            const z = dimensiones.ajusteTierra.coordenadas[2]

            const rx = dimensiones.ajusteTierra.rotacion[0]
            const ry = dimensiones.ajusteTierra.rotacion[1]
            const rz = dimensiones.ajusteTierra.rotacion[2]

            const radio = dimensiones.ajusteTierra.radio
            mat4.translate(tierraTransform, tierraTransform, [x, y, z]);
            mat4.scale(tierraTransform, tierraTransform, [radio, radio, radio]);
            mat4.rotateX(tierraTransform, tierraTransform, rx);
            mat4.rotateZ(tierraTransform, tierraTransform, ry);
            mat4.rotateY(tierraTransform, tierraTransform, rz);

             */

            const targetTierra = [mundo.tierra.x, mundo.tierra.y, mundo.tierra.z] //mundo.luna.position
            //actualizo el foco de la camara en los controles, evita un parpadeo
            //cunado cambio las camaras, los target no se mueven pero en el futuro podrian hacerlo
            controles.setFocusTierra(targetTierra)

            if (controles.focusCamera.Tierra === true) {
                camera.setFocus(targetTierra)
            }

            const anguloRad = this.posicionAnillo / 50 // dividido para un factor de velocidad, el angulo se hace mas pequeño


            mat4.translate(tierraTransform, tierraTransform, targetTierra);
            mat4.rotate(tierraTransform, tierraTransform, anguloRad, [0, 1, 0]);

            // mat4.scale(tierraTransform, tierraTransform, [mundo.tierra.radio, mundo.tierra.radio, mundo.tierra.radio]);
            mat4.rotateX(tierraTransform, tierraTransform, mundo.tierra.rx);
            mat4.rotateZ(tierraTransform, tierraTransform, mundo.tierra.ry);
            mat4.rotateY(tierraTransform, tierraTransform, mundo.tierra.rz);



        }
    }

    tierraLunaEnElMundo(random) {
        this.mundo = this.tierraLunaTransform[random]
    }

}
