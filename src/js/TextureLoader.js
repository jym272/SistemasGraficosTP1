'use strict';
import {Texture} from "./Texture";

import UVdiffuse from "../images/UV.jpg";
import UVnormal from "../images/UV_normal.jpg";
import moduloVdiffuse from '../images/texturas/moduloVioleta/diffuse.jpg';
import moduloVnormal from '../images/texturas/moduloVioleta/normal.jpg';
import moduloVspecular from '../images/texturas/moduloVioleta/specular.jpg';
import bloqueDiffuse from '../images/texturas/bloque/diffuse.jpg';
import bloqueNormal from '../images/texturas/bloque/normal.jpg';
import bloqueSpecular from '../images/texturas/bloque/specular.jpg';
import earthDiffuse from '../images/texturas/earth/Earth.Diffuse.3840.jpg';
import earthNormal from '../images/texturas/earth/Earth.Normal.3840.jpg';
import earthSpecular from '../images/texturas/earth/Earth.Specular.3840.jpg';
import earthClouds from '../images/texturas/earth/Earth.Clouds.3840.jpg';
import moonDiffuse from '../images/texturas/moon/diffuse.jpg';
import moonNormal from '../images/texturas/moon/normal.jpg';
import moonSpecular from '../images/texturas/moon/specular.jpg';
import torusDiffuse from '../images/texturas/torus/diffuse.jpg';
import torusNormal from '../images/texturas/torus/normal.jpg';
import torusSpecular from '../images/texturas/torus/specular.jpg';
import capsulaDiffuse from '../images/texturas/capsula/diffuse.jpg';
import capsulaNormal from '../images/texturas/capsula/normal.jpg';
import capsulaSpecular from '../images/texturas/capsula/specular.jpg';
import esferaDiffuse from '../images/texturas/esfera/diffuse.jpg';
import esferaNormal from '../images/texturas/esfera/normal.jpg';
import nucleoSpecular from '../images/texturas/esfera/specular.jpg';


export class TextureLoader{
    constructor(gl){
        this.gl = gl;
        this.textureMap = {};
        this.cargarTexturas();

    }
    cargarTexturas(){
        const {gl} = this;

        this.textureMap["UV"] = {
            diffuse: new Texture(gl, UVdiffuse),
            normal: new Texture(gl, UVnormal),
        }
        this.textureMap["bloque"] = {
            diffuse: new Texture(gl, bloqueDiffuse),
            normal: new Texture(gl, bloqueNormal),
            specular: new Texture(gl, bloqueSpecular)
        }
        this.textureMap['moduloVioleta'] = {
            diffuse:new Texture(gl, moduloVdiffuse),
            normal: new Texture(gl, moduloVnormal),
            specular: new Texture(gl, moduloVspecular)
        };
        this.textureMap['tierra'] = {
            diffuse: new Texture(gl, earthDiffuse),
            normal: new Texture(gl, earthNormal),
            specular: new Texture(gl, earthSpecular),
            clouds: new Texture(gl, earthClouds)
        };
        this.textureMap['luna'] = {
            diffuse: new Texture(gl, moonDiffuse),
            normal: new Texture(gl, moonNormal),
            specular: new Texture(gl, moonSpecular)
        };
        this.textureMap['torus'] = {
            diffuse: new Texture(gl, torusDiffuse),
            normal: new Texture(gl, torusNormal),
            specular: new Texture(gl, torusSpecular)
        };
        this.textureMap['capsula'] = {
            diffuse: new Texture(gl, capsulaDiffuse),
            normal: new Texture(gl, capsulaNormal),
            specular: new Texture(gl, capsulaSpecular)
        };
        this.textureMap['esfera'] = {
            diffuse: new Texture(gl, esferaDiffuse),
            normal: new Texture(gl, esferaNormal),
            specular: new Texture(gl, nucleoSpecular)
        };
    }
}