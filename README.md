# A GUI to a Lindemayer system to draw curves

This project enables you to experiment with the Lindemaier system to draw curves. This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.7.

See [Wikipedia](https://en.wikipedia.org/wiki/L-system) for more information.

# Explanation

An L-system requires a **formula**, **variables** and an **axiom** as the starting formula. Furthermore a **line length**, **rotation angle**
and **starting angle** must be specified.

## The coordinate system
The L-system is drawing curves using the [carthesian coordinates](https://en.wikipedia.org/wiki/Cartesian_coordinate_system). This means that
the X-axis runs from negative values on the left of the screen to positive values on the right of the screen. The Y-axis runs from positive
values on the top of the screen to negative values on the bottom of the screen. See the image below (&copy; Wikimedia)
![image](https://upload.wikimedia.org/wikipedia/commons/0/0e/Cartesian-coordinate-system.svg)

This is normal for mathematicians but for developers the Y-axis typically runs in the opposite direction and the top-left corner is (0,0) (origin).

## Setting up the coordinate system in SVG
The origin (0,0) is located in the center of the screen. In this website the drawing area is 800x800 pixels. Lines are drawn using the
Scalable Vector Graphics elements (see [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG). 
By using a `transform`-[attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform) on a `<g>`
[group](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g) the coordinate-system is changed to the carthesian system:

```svg
<g transform="translate(400,400) scale(1,-1)">...</g>
```

First the origin is moved to (400,400) using the `translate`-[transformation](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform#translate).
Then the Y-axis is flipped using the `scale`-[transformation](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform#scale) using 
a negative value `-1` to the second value for the Y-axis. 


# Formulas

A formula takes the form of:

> `<var>=<operations> |  <variables>`

Operations are typically:

* increase rotation with (fixed) angle : `+`
* rotate right
* push position+angle
* pop position+angle
* increase line length
* decrease line length




# Sources for L-systems

* [Wikipedia](https://en.wikipedia.org/wiki/L-system)
* [Paul Bourke](https://paulbourke.net/fractals/lsys/)
*

# Other references

* [Mozilla Development Network - SVG: Scalable Vector Graphics](https://developer.mozilla.org/en-US/docs/Web/SVG)
