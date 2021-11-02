import numpy as np


radio=3
altura=3
def posiciones(u,v):
    phi = 2*np.pi * u
    return np.array([radio*np.cos(phi),v*altura, radio*np.sin(phi)] )

def normal(u,v):
    phi = 2*np.pi * u
    return np.array([np.cos(phi), 0,np.sin(phi)])

def normalCalculada(u,v):
    delta = 0.00001
    punto_0 = posiciones(u, v)
    punto_1 = posiciones(u, v + delta)
    punto_2 = posiciones(u + delta, v)
    vectorNormal_1 = punto_0 - punto_1
    vectorNormal_2 = punto_0 - punto_2

    cross = np.cross(vectorNormal_1, vectorNormal_2);
    return np.array(cross/np.linalg.norm(cross))


u= np.arange(0,1,0.01)
v= np.arange(1,0,-0.01)

POS=[]; NORM = []; NORM_C= []; DIFF=[]
for i in range(100):
    POS.append(posiciones(u[i],v[i]))
    NORM.append(normal(u[i],v[i]))
    NORM_C.append(normalCalculada(u[i],v[i]))
    DIFF.append(normal(u[i],v[i]) - normalCalculada(u[i],v[i]))
DIFF
NORM
NORM_C









normal(0.02, 0.154)
normalCalculada(0.02, 0.154)

u=0.02; v=0.154
delta = 0.00001
punto_0 = posiciones(u, v)
punto_0

punto_1 = posiciones(u, v + delta)
punto_2 = posiciones(u + delta, v)

vecNormal_1 = punto_0 - punto_1;
vecNormal_2 = punto_0 - punto_2;

cross = np.cross(vecNormal_2, vecNormal_1);
return np.array(cross/np.linalg.norm(cross))
