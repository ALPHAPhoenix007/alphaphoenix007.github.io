(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('js-ready');

  // -------------------------
  // Page transitions
  // -------------------------
  const wipe = document.querySelector('.page-wipe');

  document.querySelectorAll('a[data-page]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      if (reduceMotion || !wipe) return;

      event.preventDefault();
      wipe.classList.remove('out');
      wipe.classList.add('in');

      window.setTimeout(() => {
        window.location.href = href;
      }, 500);
    });
  });

  window.addEventListener('pageshow', () => {
    if (!wipe) return;

    wipe.classList.remove('in');
    wipe.classList.add('out');

    window.setTimeout(() => {
      wipe.classList.remove('out');
    }, 650);
  });


  // -------------------------
  // Scroll reveals
  // -------------------------
  const revealElements = document.querySelectorAll('.reveal, .stagger');

  if (reduceMotion) {
    revealElements.forEach(el => el.classList.add('visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }


  // -------------------------
  // SVG curve draw animation
  // -------------------------
  document.querySelectorAll('.draw').forEach(path => {
    if (!path.getTotalLength || reduceMotion) {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      return;
    }

    const length = path.getTotalLength();

    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    requestAnimationFrame(() => {
      path.style.transition =
        'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)';

      path.style.strokeDashoffset = '0';
    });
  });


  // -------------------------
  // Interactive About graph
  // -------------------------
  const mathSketch = document.querySelector('.math-sketch');

  if (
    mathSketch &&
    !reduceMotion &&
    window.matchMedia('(pointer: fine)').matches
  ) {
    const curve = mathSketch.querySelector('.curve');
    const point = mathSketch.querySelector('.point');
    const guides = mathSketch.querySelectorAll('.guide');
    const labels = mathSketch.querySelectorAll('text');

    if (curve && point && guides.length >= 2) {
      const horizontalGuide = guides[0];
      const verticalGuide = guides[1];

      // The third text element is P in the SVG
      const pointLabel = labels[2];

      const totalLength = curve.getTotalLength();

      let targetX = 178;
      let currentX = 178;

      // Convert mouse position into SVG/viewBox coordinates
      const getSVGPoint = event => {
        const pointInSVG = mathSketch.createSVGPoint();

        pointInSVG.x = event.clientX;
        pointInSVG.y = event.clientY;

        const matrix = mathSketch.getScreenCTM();

        if (!matrix) return null;

        return pointInSVG.matrixTransform(matrix.inverse());
      };

      // Find a point on the curve close to the requested x-coordinate
      const findPointOnCurve = x => {
        let bestPoint = null;
        let bestDistance = Infinity;

        // Sample the curve.
        // This is intentionally lightweight so the interaction stays smooth.
        for (let i = 0; i <= 140; i++) {
          const sample = curve.getPointAtLength(
            (i / 140) * totalLength
          );

          const distance = Math.abs(sample.x - x);

          if (distance < bestDistance) {
            bestDistance = distance;
            bestPoint = sample;
          }
        }

        return bestPoint;
      };

      const updateGraph = () => {
        currentX += (targetX - currentX) * 0.12;

        const curvePoint = findPointOnCurve(currentX);

        if (curvePoint) {
          const x = curvePoint.x;
          const y = curvePoint.y;

          // Move the orange point
          point.setAttribute('cx', x);
          point.setAttribute('cy', y);

          // Vertical guide
          verticalGuide.setAttribute('x1', x);
          verticalGuide.setAttribute('y1', y);
          verticalGuide.setAttribute('x2', x);
          verticalGuide.setAttribute('y2', 258);

          // Horizontal guide
          horizontalGuide.setAttribute('x1', 62);
          horizontalGuide.setAttribute('y1', y);
          horizontalGuide.setAttribute('x2', x);
          horizontalGuide.setAttribute('y2', y);

          // Move the P label
          if (pointLabel) {
            pointLabel.setAttribute('x', x + 7);
            pointLabel.setAttribute('y', y - 8);
          }
        }

        requestAnimationFrame(updateGraph);
      };

      mathSketch.addEventListener('pointermove', event => {
        const svgPoint = getSVGPoint(event);

        if (!svgPoint) return;

        // Keep the interaction inside the useful part of the graph.
        targetX = Math.max(
          55,
          Math.min(282, svgPoint.x)
        );
      });

      mathSketch.addEventListener('pointerleave', () => {
        // Return gently to the original point when the mouse leaves.
        targetX = 178;
      });

      updateGraph();
    }
  }


  // -------------------------
  // Custom cursor
  // -------------------------
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');

  if (
    dot &&
    ring &&
    !reduceMotion &&
    window.matchMedia('(pointer: fine)').matches
  ) {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    window.addEventListener('mousemove', event => {
      x = event.clientX;
      y = event.clientY;
    });

    const updateCursor = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;

      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;

      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;

      requestAnimationFrame(updateCursor);
    };

    updateCursor();

    document
      .querySelectorAll('a, .project, #tesseract, .math-sketch')
      .forEach(el => {
        el.addEventListener('mouseenter', () =>
          document.body.classList.add('cursor-grow')
        );

        el.addEventListener('mouseleave', () =>
          document.body.classList.remove('cursor-grow')
        );
      });
  }


  // -------------------------
  // Project hover
  // -------------------------
  document.querySelectorAll('.project').forEach(project => {
    project.addEventListener('mouseenter', () =>
      project.classList.add('seen')
    );

    project.addEventListener('mouseleave', () =>
      project.classList.remove('seen')
    );
  });


  // -------------------------
  // Interactive 4D tesseract
  // Only runs on Research page.
  // -------------------------
  const svg = document.getElementById('tesseract');
  const edgeLayer = document.getElementById('tesseractEdges');
  const pointLayer = document.getElementById('tesseractPoints');
  const angleReadout = document.getElementById('angleReadout');

  if (svg && edgeLayer && pointLayer) {
    const vertices = [];

    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        for (const z of [-1, 1]) {
          for (const w of [-1, 1]) {
            vertices.push([x, y, z, w]);
          }
        }
      }
    }

    const edges = [];

    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        let differences = 0;

        for (let k = 0; k < 4; k++) {
          if (vertices[i][k] !== vertices[j][k]) {
            differences++;
          }
        }

        if (differences === 1) {
          edges.push([i, j]);
        }
      }
    }

    let xwAngle = 0.34;
    let yzAngle = 0.18;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function rotate(value, a, b, theta) {
      const result = [...value];

      const cosine = Math.cos(theta);
      const sine = Math.sin(theta);

      result[a] =
        value[a] * cosine +
        value[b] * sine;

      result[b] =
        -value[a] * sine +
        value[b] * cosine;

      return result;
    }

    function project(value) {
      const scale = 76;

      return {
        x: 260 + (value[0] + 0.42 * value[3]) * scale,

        y:
          215 +
          (value[1] +
            0.35 * value[2] -
            0.24 * value[3]) *
            scale
      };
    }

    function renderTesseract() {
      const rotated = vertices.map(vertex =>
        rotate(
          rotate(vertex, 0, 3, xwAngle),
          1,
          2,
          yzAngle
        )
      );

      const points = rotated.map(project);

      edgeLayer.innerHTML = edges
        .map(([a, b], index) => {
          const first = points[a];
          const second = points[b];

          const className =
            index % 7 === 0
              ? ' class="inner"'
              : '';

          return `<line${className}
            x1="${first.x.toFixed(2)}"
            y1="${first.y.toFixed(2)}"
            x2="${second.x.toFixed(2)}"
            y2="${second.y.toFixed(2)}"/>`;
        })
        .join('');

      pointLayer.innerHTML = points
        .map(point =>
          `<circle
            cx="${point.x.toFixed(2)}"
            cy="${point.y.toFixed(2)}"
            r="3"/>`
        )
        .join('');

      if (angleReadout) {
        angleReadout.textContent =
          `θxw = ${Math.round(
            xwAngle * 180 / Math.PI
          )}°  ·  θyz = ${Math.round(
            yzAngle * 180 / Math.PI
          )}°`;
      }
    }

    renderTesseract();

    svg.addEventListener('pointerdown', event => {
      dragging = true;

      lastX = event.clientX;
      lastY = event.clientY;

      svg.classList.add('dragging');

      try {
        svg.setPointerCapture(event.pointerId);
      } catch (_) {}
    });

    svg.addEventListener('pointermove', event => {
      if (!dragging) return;

      xwAngle +=
        (event.clientX - lastX) * 0.009;

      yzAngle +=
        (event.clientY - lastY) * 0.009;

      lastX = event.clientX;
      lastY = event.clientY;

      renderTesseract();
    });

    const stopDragging = () => {
      dragging = false;
      svg.classList.remove('dragging');
    };

    svg.addEventListener('pointerup', stopDragging);
    svg.addEventListener('pointercancel', stopDragging);
    svg.addEventListener('pointerleave', stopDragging);
  }
    // -------------------------
  // Interactive Thinking geometry
  // -------------------------
  const distancePlane = document.getElementById('distancePlane');
  const pointA = document.getElementById('pointA');
  const pointB = document.getElementById('pointB');
  const distanceLine = document.getElementById('distanceLine');
  const labelA = document.getElementById('labelA');
  const labelB = document.getElementById('labelB');
  const distanceFormula = document.getElementById('distanceFormula');
  const distanceReadout = document.getElementById('distanceReadout');

  if (
    distancePlane &&
    pointA &&
    pointB &&
    distanceLine
  ) {

    let draggingPoint = null;

    const points = {
      A: {
        x: 190,
        y: 180
      },

      B: {
        x: 510,
        y: 100
      }
    };


    function getSVGPoint(event) {

      const point = distancePlane.createSVGPoint();

      point.x = event.clientX;
      point.y = event.clientY;

      const matrix = distancePlane.getScreenCTM();

      if (!matrix) {
        return null;
      }

      return point.matrixTransform(matrix.inverse());
    }


    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }


    function updateDistance() {

      const a = points.A;
      const b = points.B;

      pointA.setAttribute('cx', a.x);
      pointA.setAttribute('cy', a.y);

      pointB.setAttribute('cx', b.x);
      pointB.setAttribute('cy', b.y);


      distanceLine.setAttribute('x1', a.x);
      distanceLine.setAttribute('y1', a.y);

      distanceLine.setAttribute('x2', b.x);
      distanceLine.setAttribute('y2', b.y);


      labelA.setAttribute('x', a.x - 10);
      labelA.setAttribute('y', a.y - 15);

      labelB.setAttribute('x', b.x + 10);
      labelB.setAttribute('y', b.y - 8);


      const dx = b.x - a.x;
      const dy = b.y - a.y;

      const distance = Math.sqrt(
        dx * dx + dy * dy
      );

      /*
        Scale the visual SVG distance into
        a small, readable mathematical value.
      */
      const displayedDistance =
        (distance / 80).toFixed(2);


      if (distanceReadout) {
        distanceReadout.textContent =
          `d(A,B) = ${displayedDistance}`;
      }


      const midpointX =
        (a.x + b.x) / 2;

      const midpointY =
        (a.y + b.y) / 2;


      distanceFormula.setAttribute(
        'x',
        midpointX - 25
      );

      distanceFormula.setAttribute(
        'y',
        midpointY - 12
      );
    }


    function startDragging(pointName, event) {

      draggingPoint = pointName;

      distancePlane.classList.add(
        'distance-dragging'
      );

      try {
        distancePlane.setPointerCapture(
          event.pointerId
        );
      } catch (_) {}
    }


    pointA.addEventListener(
      'pointerdown',
      event => {
        startDragging('A', event);
      }
    );


    pointB.addEventListener(
      'pointerdown',
      event => {
        startDragging('B', event);
      }
    );


    distancePlane.addEventListener(
      'pointermove',
      event => {

        if (!draggingPoint) {
          return;
        }

        const svgPoint =
          getSVGPoint(event);

        if (!svgPoint) {
          return;
        }


        points[draggingPoint].x =
          clamp(
            svgPoint.x,
            65,
            635
          );

        points[draggingPoint].y =
          clamp(
            svgPoint.y,
            55,
            235
          );


        updateDistance();
      }
    );


    function stopDragging() {

      draggingPoint = null;

      distancePlane.classList.remove(
        'distance-dragging'
      );
    }


    distancePlane.addEventListener(
      'pointerup',
      stopDragging
    );

    distancePlane.addEventListener(
      'pointercancel',
      stopDragging
    );

    distancePlane.addEventListener(
      'pointerleave',
      stopDragging
    );


    updateDistance();
  }
})();