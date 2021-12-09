import {Bloque} from "./Bloque";
import {mat4} from "gl-matrix";
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

    constructor(transforms, droneCam, controles, camera, bloque, animacion) {
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
        }
        this.posicionAnillo = 0;
        this.cargarParametrosBloques();
        this.cuboTransform = transforms.modelViewMatrix;
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

            controles.setFocusCapsula(position) //evita un parpadeo en la camara
            if (controles.focusCamera.Capsula === true) {
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


            mat4.translate(Capsula.capsulaTransform, Capsula.capsulaTransform, position);
            mat4.multiply(Capsula.capsulaTransform, Capsula.capsulaTransform, rotationMatrix);
            //mat4.translate(Capsula.capsulaTransform, Capsula.capsulaTransform, posicionRespectoLaNave);
            mat4.rotate(Capsula.capsulaTransform, Capsula.capsulaTransform, Math.PI, [1, 0, 0]);


        } else if (this.alias === 'capsulaCuerpoCilindroA') {
            const capsulaCuerpoCilindroATransform = transforms.modelViewMatrix;

            mat4.translate(capsulaCuerpoCilindroATransform, Capsula.capsulaTransform, [0, 0, 0.1]);
            mat4.rotate(capsulaCuerpoCilindroATransform, capsulaCuerpoCilindroATransform, -Math.PI / 2, [1, 0, 0]);

        } else if (this.alias === 'capsulaCuerpoCilindroB') {
            const capsulaCuerpoCilindroBTransform = transforms.modelViewMatrix;

            mat4.translate(capsulaCuerpoCilindroBTransform, Capsula.capsulaTransform, [0, 0, 0.3]);
            mat4.rotate(capsulaCuerpoCilindroBTransform, capsulaCuerpoCilindroBTransform, -Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'capsulaCuerpoBezierA') {

            const capsulaCuerpoBezierATransform = transforms.modelViewMatrix;
            mat4.rotate(capsulaCuerpoBezierATransform, Capsula.capsulaTransform, Math.PI / 2, [0, 0, 1]);
        } else if (this.alias === 'capsulaCuerpoCilindroC') {

            const capsulaCuerpoCilindroCTransform = transforms.modelViewMatrix;
            mat4.translate(capsulaCuerpoCilindroCTransform, Capsula.capsulaTransform, [0, 0, 2.51]);

            mat4.rotate(capsulaCuerpoCilindroCTransform, capsulaCuerpoCilindroCTransform, -Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'capsulaCuerpoCilindroD') {

            const capsulaCuerpoCilindroDTransform = transforms.modelViewMatrix;
            mat4.translate(capsulaCuerpoCilindroDTransform, Capsula.capsulaTransform, [0, 0, 2.9]);

            mat4.rotate(capsulaCuerpoCilindroDTransform, capsulaCuerpoCilindroDTransform, -Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'capsulaCuerpoCilindroE') {

            const capsulaCuerpoCilindroETransform = transforms.modelViewMatrix;
            mat4.translate(capsulaCuerpoCilindroETransform, Capsula.capsulaTransform, [0, 0, 2.9 + 0.001]);

            mat4.rotate(capsulaCuerpoCilindroETransform, capsulaCuerpoCilindroETransform, -Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'capsulaCola') {

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
        }
    }

    esfera() {
        const {transforms} = this;

        if (this.alias === 'esfera') {
            Esfera.esferaTransform = transforms.modelViewMatrix;
            mat4.translate(Esfera.esferaTransform, Nave.naveTransform, [0, 0, -Esfera.posRelativaALaNave]);
        } else if (this.alias === 'esferaTapaAtras') {
            const esferaTapaAtrasTransform = transforms.modelViewMatrix;
            mat4.translate(esferaTapaAtrasTransform, Esfera.esferaTransform, [0, 0, Esfera.radio * Math.cos(Esfera.angulo)]);
            mat4.rotate(esferaTapaAtrasTransform, esferaTapaAtrasTransform, Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'esferaTapaAdelante') {
            const esferaTapaAdenlanteTransform = transforms.modelViewMatrix;
            mat4.translate(esferaTapaAdenlanteTransform, Esfera.esferaTransform, [0, 0, -Esfera.radio * Math.cos(Esfera.angulo)]);
            mat4.rotate(esferaTapaAdenlanteTransform, esferaTapaAdenlanteTransform, Math.PI / 2, [-1, 0, 0]);
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

        if(this.alias === 'nucleoPS'){
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

        } else if (this.alias === 'tapaSecundaria1') {
            const tapaSecundariaTransform = transforms.modelViewMatrix;
            mat4.translate(tapaSecundariaTransform, PanelesSolares.tuboSecundarioTransform, [0, dimensiones.panelSolar.tuboSecundario.altura, 0]);
        } else if (this.alias === 'tapaSecundaria2') {
            const tapaSecundariaTransform = transforms.modelViewMatrix;
            mat4.translate(tapaSecundariaTransform, PanelesSolares.tuboSecundarioTransform, [0, 0, 0]);
            mat4.rotateX(tapaSecundariaTransform, tapaSecundariaTransform, Math.PI);
        } else if (this.alias === 'panelSolar1') {
            PanelesSolares.panelTransform = transforms.modelViewMatrix;
            mat4.translate(PanelesSolares.panelTransform, PanelesSolares.tuboSecundarioTransform, [0, -dimensiones.panelSolar.tapa.largo / 2, 0]);
            mat4.rotateX(PanelesSolares.panelTransform, PanelesSolares.panelTransform, -Math.PI / 2);
            mat4.rotateZ(PanelesSolares.panelTransform, PanelesSolares.panelTransform, 2 * Math.PI * this.panelSolar.anguloRotacion / 360);

        } else if (this.alias === 'panelSolar2') {
            PanelesSolares.panelTransform = transforms.modelViewMatrix;
            mat4.translate(PanelesSolares.panelTransform, PanelesSolares.tuboSecundarioTransform, [0, dimensiones.panelSolar.tuboSecundario.altura + dimensiones.panelSolar.tapa.largo / 2, 0]);
            mat4.rotateX(PanelesSolares.panelTransform, PanelesSolares.panelTransform, -Math.PI / 2);
            mat4.rotateZ(PanelesSolares.panelTransform, PanelesSolares.panelTransform, 2 * Math.PI * this.panelSolar.anguloRotacion / 360);

        } else if (this.alias === 'panelTapaSuperior') {
            const panelTapaSuperiorTransform = transforms.modelViewMatrix;
            mat4.translate(panelTapaSuperiorTransform, PanelesSolares.panelTransform, [0, dimensiones.panelSolar.lado.ancho, 0]);
        } else if (this.alias === 'panelTapaInferior') {
            const panelTapaInferiorTransform = transforms.modelViewMatrix;
            mat4.rotate(panelTapaInferiorTransform, PanelesSolares.panelTransform, Math.PI, [1, 0, 0]);

        } else if (this.alias === 'panelLadoA') {
            const panelLadoATransform = transforms.modelViewMatrix;
            mat4.translate(panelLadoATransform, PanelesSolares.panelTransform, [0, dimensiones.panelSolar.lado.ancho / 2, dimensiones.panelSolar.tapa.largo / 2]);

            mat4.rotate(panelLadoATransform, panelLadoATransform, Math.PI / 2, [0, 0, 1]);
            mat4.rotate(panelLadoATransform, panelLadoATransform, Math.PI, [0, 1, 1]);

        } else if (this.alias === 'panelLadoA1') {
            const panelLadoA1Transform = transforms.modelViewMatrix;
            mat4.translate(panelLadoA1Transform, PanelesSolares.panelTransform, [0, dimensiones.panelSolar.lado.ancho / 2, -dimensiones.panelSolar.tapa.largo / 2]);

            mat4.rotate(panelLadoA1Transform, panelLadoA1Transform, Math.PI / 2, [1, 0, 0]);
            mat4.rotate(panelLadoA1Transform, panelLadoA1Transform, -Math.PI, [1, 0, 1]);

        } else if (this.alias === 'panelLadoB') {
            const panelLadoBTransform = transforms.modelViewMatrix;
            mat4.translate(panelLadoBTransform, PanelesSolares.panelTransform, [dimensiones.panelSolar.lado.largo / 2, dimensiones.panelSolar.lado.ancho / 2, 0]);

            mat4.rotate(panelLadoBTransform, panelLadoBTransform, Math.PI, [1, 1, 0]);
        } else if (this.alias === 'panelLadoB1') {
            const panelLadoB1Transform = transforms.modelViewMatrix;
            mat4.translate(panelLadoB1Transform, PanelesSolares.panelTransform, [-dimensiones.panelSolar.lado.largo / 2, dimensiones.panelSolar.lado.ancho/ 2, 0]);
            mat4.rotate(panelLadoB1Transform, panelLadoB1Transform, -Math.PI, [0, 0, 1]);
            mat4.rotate(panelLadoB1Transform, panelLadoB1Transform, -Math.PI, [1, 1, 0]);
        }
    }

    nucleoDelAnillo() {
        const {transforms} = this;
        if(this.alias === "nucleoAnillo"){
            Nucleo.nucleoAnilloTransform = transforms.modelViewMatrix
            mat4.translate(Nucleo.nucleoAnilloTransform, Nave.naveTransform, [0, 0, -Bloques.distanciaNucleoDelAnilloYNave])
            mat4.rotate(Nucleo.nucleoAnilloTransform, Nucleo.nucleoAnilloTransform, Math.PI / 2, [1, 0, 0])
        }
    }

    animarAnillo(diferencial){
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

        } else if (this.alias === 'pastillaCilindroSup') {
            const pastillaCilindroSupTransform = transforms.modelViewMatrix;
            mat4.rotate(pastillaCilindroSupTransform, Anillo.pastillaTransform, Math.PI / 2, [0, 1, 0]);
            mat4.translate(pastillaCilindroSupTransform, pastillaCilindroSupTransform, [0, dimensiones.pastillas.cuerpo.altura, 0]);

        } else if (this.alias === 'pastillaCilindroInf') {
            const pastillaCilindroInfTransform = transforms.modelViewMatrix;
            mat4.rotate(pastillaCilindroInfTransform, Anillo.pastillaTransform, -Math.PI, [1, 0, 0]);
            mat4.rotate(pastillaCilindroInfTransform, pastillaCilindroInfTransform, Math.PI / 2, [0, 1, 0]);

        } else if (this.alias === 'pastillaTapaSup') {
            const pastillaTapaSupTransform = transforms.modelViewMatrix;
            mat4.rotate(pastillaTapaSupTransform, Anillo.pastillaTransform, 0, [1, 0, 0]);
            mat4.translate(pastillaTapaSupTransform, pastillaTapaSupTransform, [0, Anillo.alturaTapaSuperior, 0]);

        } else if (this.alias === 'pastillaTapaInf') {
            const pastillaTapaInfTransform = transforms.modelViewMatrix;
            mat4.rotate(pastillaTapaInfTransform, Anillo.pastillaTransform, -Math.PI, [1, 0, 0]);
            mat4.translate(pastillaTapaInfTransform, pastillaTapaInfTransform, [0, Anillo.alturaTapaInferior, 0]);

        } else if (this.alias === 'torus') { //ANILLO
            Anillo.torusTransform = transforms.modelViewMatrix;
            mat4.translate(Anillo.torusTransform, Anillo.pastillaTransform, [0, dimensiones.pastillas.cuerpo.altura / 2, 0]);
            mat4.rotate(Anillo.torusTransform, Anillo.torusTransform, Math.PI / 2, [1, 0, 0]);
        } else if (this.alias === 'anillo_tuboH1') {
            const tuboH1Transform = transforms.modelViewMatrix;
            mat4.translate(tuboH1Transform, Anillo.torusTransform, [-dimensiones.anillo.distanciaEntreTubos, -dimensiones.anillo.tubo.altura / 2, 0]);
        } else if (this.alias === 'anillo_tuboH2') {
            const tuboH2Transform = transforms.modelViewMatrix;
            mat4.translate(tuboH2Transform, Anillo.torusTransform, [dimensiones.anillo.distanciaEntreTubos, -dimensiones.anillo.tubo.altura  / 2, 0]);
        } else if (this.alias === 'anillo_tuboV1') {
            const tuboV1Transform = transforms.modelViewMatrix;
            mat4.translate(tuboV1Transform, Anillo.torusTransform, [dimensiones.anillo.tubo.altura  / 2, dimensiones.anillo.distanciaEntreTubos, 0]);
            mat4.rotate(tuboV1Transform, tuboV1Transform, Math.PI / 2, [0, 0, 1]);
        } else if (this.alias === 'anillo_tuboV2') {
            const tuboV2Transform = transforms.modelViewMatrix;
            mat4.translate(tuboV2Transform, Anillo.torusTransform, [dimensiones.anillo.tubo.altura  / 2, -dimensiones.anillo.distanciaEntreTubos, 0]);
            mat4.rotate(tuboV2Transform, tuboV2Transform, Math.PI / 2, [0, 0, 1]);
        } else if (this.alias === 'anillo_tuboInterior') {
            const tubointeriorTransform = transforms.modelViewMatrix;
            if (Anillo.desplazamientoTuboInterior < dimensiones.anillo.tubo.altura )
                mat4.translate(tubointeriorTransform, Anillo.torusTransform, [0, Anillo.distanciaTubosInteriores - Anillo.desplazamientoTuboInterior, 0]);
            else
                mat4.translate(tubointeriorTransform, Anillo.torusTransform, [Anillo.factorDesplazamientoEntreTubosInteriores * Anillo.distanciaTubosInteriores - Anillo.desplazamientoTuboInterior, 0, 0]);

            mat4.rotate(tubointeriorTransform, tubointeriorTransform, Anillo.sentidoTuboInterior * Math.PI / 4, [0, 0, 1]);
            mat4.translate(tubointeriorTransform, tubointeriorTransform, [0, -dimensiones.anillo.tuboInterior.altura / 2, 0]);
            Anillo.sentidoTuboInterior *= -1;
            Anillo.desplazamientoTuboInterior += dimensiones.anillo.distanciaEntreTubos * 2
        }
    }

    luna(){
        const {transforms} = this;
        if(this.alias === 'luna'){
            const lunaTransform = transforms.modelViewMatrix;
            mat4.translate(lunaTransform, lunaTransform, [0,0, 0]);
            // mat4.rotate(lunaTransform, lunaTransform, Math.PI / 2, [1, 0, 0]);
        }
    }

    translate(testTransform, x,y){
        mat4.translate(testTransform, testTransform, [x,0,-y]);
    }
    rotate(transform, angle){
        const angleRadians = angle * Math.PI / 180;
        mat4.rotate(transform, transform, angleRadians, [0, 1, 0]);
    }
    scale(transform, x,y){
        mat4.scale(transform, transform, [x,0,y]);
    }

    test(){
        const {transforms} = this;
        if(this.alias === 'test'){
            const testTransform = transforms.modelViewMatrix;

             this.translate(testTransform, -4,-6);
           // this.rotate(testTransform, 90);
            // this.translate(testTransform, 4,0);
            //this.translate(testTransform, 2,0);

            this.translate(testTransform, 4,0);
            this.scale(testTransform, 2,2);

             this.rotate(testTransform, 45);
           this.translate(testTransform, 2,0);
            this.translate(testTransform, 2,-0.5);

        }
    }
    cubo(){
        const {transforms} = this;
        if(this.alias === 'cubo'){
            Cubo.transform = transforms.modelViewMatrix;
        }else if(this.alias === 'cubo_lado1'){
            const cuboLadoTransform = transforms.modelViewMatrix;
            mat4.translate(cuboLadoTransform, Cubo.transform, [0, 0, Cubo.lado / 2]);
            mat4.rotate(cuboLadoTransform, cuboLadoTransform , Math.PI / 2, [1, 0, 0]);
        }else if(this.alias === 'cubo_lado2'){
            const cuboLadoTransform = transforms.modelViewMatrix;
            mat4.translate(cuboLadoTransform, Cubo.transform, [0, 0, -Cubo.lado / 2]);
            mat4.rotate(cuboLadoTransform, cuboLadoTransform , Math.PI / 2, [-1, 0, 0]);
        }else if(this.alias === 'cubo_lado3'){
            const cuboLadoTransform = transforms.modelViewMatrix;
            mat4.rotate(cuboLadoTransform, Cubo.transform , Math.PI / 2, [0, 1, 0]);
            mat4.translate(cuboLadoTransform,cuboLadoTransform, [0, 0, -Cubo.lado / 2]);
            mat4.rotate(cuboLadoTransform, cuboLadoTransform , Math.PI / 2, [-1, 0, 0]);
        }else if(this.alias === 'cubo_lado4'){
            const cuboLadoTransform = transforms.modelViewMatrix;
            mat4.rotate(cuboLadoTransform, Cubo.transform , -Math.PI / 2, [0, 1, 0]);
            mat4.translate(cuboLadoTransform,cuboLadoTransform, [0, 0, -Cubo.lado / 2]);
            mat4.rotate(cuboLadoTransform, cuboLadoTransform , Math.PI / 2, [-1, 0, 0]);
        }else if(this.alias === 'cubo_lado5'){
            const cuboLadoTransform = transforms.modelViewMatrix;
            mat4.translate(cuboLadoTransform,Cubo.transform, [0, Cubo.lado / 2, 0]);
        }else if(this.alias === 'cubo_lado6'){
            const cuboLadoTransform = transforms.modelViewMatrix;
            mat4.translate(cuboLadoTransform,Cubo.transform, [0, -Cubo.lado / 2, 0]);
            mat4.rotate(cuboLadoTransform, cuboLadoTransform , Math.PI, [1, 0, 0]);

        }
    }

    teatro(){
        const {transforms} = this;
        if(this.alias === 'teatro'){
            Teatro.transform = transforms.modelViewMatrix;
        }else if(this.alias === 'teatro_lado1'){
            const teatroLadoTransform = transforms.modelViewMatrix;
            // mat4.translate(teatroLadoTransform, Teatro.transform, [0, 0, 2]);
          //  mat4.rotate(teatroLadoTransform, teatroLadoTransform , Math.PI / 2, [1, 0, 0]);
        }else if(this.alias === 'teatro_lado2'){
            const teatroLadoTransform = transforms.modelViewMatrix;
            mat4.translate(teatroLadoTransform, Teatro.transform, [0, 2, -2]);
            mat4.rotate(teatroLadoTransform, teatroLadoTransform , Math.PI / 2, [1, 0, 0]);
        }else if(this.alias === 'teatro_lado3'){
            const teatroLadoTransform = transforms.modelViewMatrix;
            mat4.rotate(teatroLadoTransform, Teatro.transform , Math.PI / 2, [0, 1, 0]);
            mat4.translate(teatroLadoTransform,teatroLadoTransform, [0, 2, -2]);
            mat4.rotate(teatroLadoTransform, teatroLadoTransform , Math.PI / 2, [1, 0, 0]);
        }

    }
    complexCube() {
        const {transforms} = this;
        if (this.alias === 'complexCube') {
            const complexCubeTransform = transforms.modelViewMatrix;
            mat4.scale(complexCubeTransform, complexCubeTransform, [5, 5, 5]);
        }
    }

}
