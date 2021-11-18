'use strict';

import { vec3, mat4 } from 'gl-matrix';

//tiene que ser una clase
export function DroneCameraControl(initialPos, camera){

    let MIN_Y=1;

    let DELTA_TRASLACION=0.5;        // velocidad de traslacion
    let DELTA_ROTACION=0.02;         // velocidad de rotacion
    let FACTOR_INERCIA=0.05;

    this.camera=camera;

    if (!initialPos) initialPos=[0,0,0];

    let position=vec3.fromValues(initialPos[0],initialPos[1],initialPos[2]);
    let rotation=vec3.create();

    let rotationMatrix=mat4.create();

    let worldMatrix=mat4.create();
    //create a setter for the world matrix
    Object.defineProperty(this, 'worldMatrix', {
        set: function(value){
            worldMatrix=value;
        }
    });

    let camInitialState={
        xVel:0,
        zVel:0,
        yVel:0,
        xVelTarget:0,
        zVelTarget:0,
        yVelTarget:0,

        yRotVelTarget:0,
        yRotVel:0,
        zRotVelTarget:0,
        zRotVel:0,
        xRotVelTarget:0,
        xRotVel:0,

        rightAxisMode:"move"
    }

    let camState=Object.assign({},camInitialState);


    this.listener1 = function(e){
        //console.log(e.key);

        /*
            ASDWQE para rotar en 3 ejes en el espacio del objeto

            Flechas + PgUp/PgDw o HJKUOL para trasladar en el espacio del objeto

        */

        switch ( e.key ) {

            case "ArrowUp":  case "w": // up
                camera.returnToCapsulaHome(-30,0)
                camState.zVelTarget=DELTA_TRASLACION; break;
            case "ArrowDown": case "s": // down
                camera.returnToCapsulaHome(-30,180)
                camState.zVelTarget=-DELTA_TRASLACION; break;

            case "ArrowLeft": case "a": // left
                camera.returnToCapsulaHome(-30,90)

                camState.xVelTarget=DELTA_TRASLACION;break;
            case "ArrowRight": case "d": // right
                camera.returnToCapsulaHome(-30,-90)
                camState.xVelTarget=-DELTA_TRASLACION; break;

            case "q": case "PageUp": case " ":// PgUp
                camera.returnToCapsulaHome(90,0)
                camState.yVelTarget=DELTA_TRASLACION;break;
            case "e": case "PageDown":// PgDw
                camera.returnToCapsulaHome(-90,0)
                camState.yVelTarget=-DELTA_TRASLACION; break;


            case "k":
                camState.xRotVelTarget=DELTA_ROTACION;break;
            case "i":
                camState.xRotVelTarget=-DELTA_ROTACION;break;


            case "j":
                camState.yRotVelTarget=DELTA_ROTACION; break;
            case "l":
                camState.yRotVelTarget=-DELTA_ROTACION; break;


            case "u":
                camState.zRotVelTarget=DELTA_ROTACION;break;
            case "o":
                camState.zRotVelTarget=-DELTA_ROTACION;break;



            case "r":
                rotation=vec3.create();
                position=vec3.fromValues(initialPos[0],initialPos[1],initialPos[2]);
                camState=Object.assign({},camInitialState);
                rotationMatrix=mat4.create();
                break;

            case "t":
                rotation=vec3.create();
                camState=Object.assign({},camInitialState);
                break;

        }

    }

    this.escuchar=function(boolean = true) {

        if(boolean){
            // Eventos de teclado **********************************************

            document.addEventListener("keydown", this.listener1);

            document.addEventListener("keyup",function(e){

                switch ( e.key )
                {
                    case "ArrowUp":  case "w": case "ArrowDown": case "s":
                    camState.zVelTarget=0; break;

                    case "ArrowLeft": case "a": case "ArrowRight": case "d":
                    camState.xVelTarget=0; break;

                    case "q": case "e":
                    case "PageDown": case "PageUp": case " ":
                    camState.yVelTarget=0;break;


                    case "j":
                        camState.yRotVelTarget=0; break;
                    case "l":
                        camState.yRotVelTarget=0; break;

                    case "i":
                        camState.xRotVelTarget=0;break;
                    case "k":
                        camState.xRotVelTarget=0;break;

                    case "u":
                        camState.zRotVelTarget=0;break;
                    case "o":
                        camState.zRotVelTarget=0;break;


                }

            })

        }else{
           //remover los eventos de teclado
            document.removeEventListener("keydown", this.listener1);

        }


    }

    this.update=function(){
       // this.escuchar()

        camState.xVel+=(camState.xVelTarget-camState.xVel)*FACTOR_INERCIA;
        camState.yVel+=(camState.yVelTarget-camState.yVel)*FACTOR_INERCIA;
        camState.zVel+=(camState.zVelTarget-camState.zVel)*FACTOR_INERCIA;

        camState.xRotVel+=(camState.xRotVelTarget-camState.xRotVel)*FACTOR_INERCIA;
        camState.yRotVel+=(camState.yRotVelTarget-camState.yRotVel)*FACTOR_INERCIA;
        camState.zRotVel+=(camState.zRotVelTarget-camState.zRotVel)*FACTOR_INERCIA;

        let translation=vec3.fromValues(-camState.xVel,camState.yVel,-camState.zVel);


        if (Math.abs(camState.xRotVel)>0) {
            // este metodo aplica una rotacion en el eje AXIS en el espacio del objeto o respecto del eje "local", NO el eje de mundo
            mat4.rotate(rotationMatrix,rotationMatrix,camState.xRotVel,vec3.fromValues(1,0,0));
        }

        if (Math.abs(camState.yRotVel)>0) {
            mat4.rotate(rotationMatrix,rotationMatrix,camState.yRotVel,vec3.fromValues(0,1,0));
        }

        if (Math.abs(camState.zRotVel)>0) {
            mat4.rotate(rotationMatrix,rotationMatrix,camState.zRotVel,vec3.fromValues(0,0,1));
        }


        vec3.transformMat4(translation,translation,rotationMatrix);
        vec3.add(position,position,translation);

        worldMatrix=mat4.create();
        mat4.translate(worldMatrix,worldMatrix,position);
        mat4.multiply(worldMatrix,worldMatrix,rotationMatrix);

        return {
            rotationMatrix,
            position,
        }

    }


    this.getViewMatrix=function(){

        let m=mat4.clone(worldMatrix);
        mat4.invert(m,m);
        return m;
    }

    this.getMatrix=function(){

        return worldMatrix;

    }



}
