from sympy import *

#%%
x = Symbol('x')
y = Symbol('y')
z = Symbol('z')
#%%
eq = Eq(0, x**2 + y**2 + z**2 - 2*x*y - 2*y*z - 2*z*x)
eq