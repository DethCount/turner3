$(() => {
    let canvas = $('#canvas').get(0);
    let canvas2 = $('#canvas2').get(0);
    let ctxt = canvas.getContext('2d');
    let ctxt2 = canvas2.getContext('2d');

    let width = 256, height = 256;
    canvas.width = width;
    canvas.height = height;
    canvas2.width = width;
    canvas2.height = height;

    class Square {
        constructor(
            sizeX, sizeY,
            divsX, divsY,
            offsetX, offsetY,
            feedTheBeast,
            fromMiddle,
            middleSize,
            fromBorder,
            borderSize,
            whiteNoise,
            initSign,
            initDiagonals,
            sequenceStr, cw, startPhase, feedPhase
        ) {
            this.sizeX = sizeX;
            this.sizeY = sizeY;
            this.divsX = divsX;
            this.divsY = divsY;
            this.sideX = Math.floor(this.sizeX / this.divsX);
            this.sideY = Math.floor(this.sizeY / this.divsY);
            this.offsetX = offsetX || 0;
            this.offsetY = offsetY || 0;
            this.feedTheBeast = feedTheBeast == false ? false : true;
            this.initFeedTheBeast = feedTheBeast;
            this.fromMiddle = fromMiddle == undefined ? false : fromMiddle;
            this.middleSize = middleSize == undefined ? 2 : middleSize;
            this.fromBorder = fromBorder == undefined ? false : fromBorder;
            this.borderSize = borderSize == undefined ? 1 : borderSize;
            this.whiteNoise = whiteNoise == undefined ? false : whiteNoise;
            this.initSign = initSign == undefined ? 1 : initSign;
            this.initDiagonals = initDiagonals == undefined ? -1 : initDiagonals;
            this.cw = cw;
            this.startPhase = startPhase;
            this.feedPhase = feedPhase;
            this.paused = false;
            this.stopped = false;
            this.sequenceStr = sequenceStr;

            this.init();
            this.initWidget();
        }

        init() {
            canvas.width = this.sizeX;
            canvas.height = this.sizeY;
            canvas2.width = this.sizeX;
            canvas2.height = this.sizeY;
            this.sideX = Math.floor(this.sizeX / this.divsX);
            this.sideY = Math.floor(this.sizeY / this.divsY);
            this.sequence = this.sequenceStr.split(' ');
            this.initData();
            this.animationArgs = [this.startPhase, this.cw, false];
        }

        initData(debug) {
            this.data = [];
            this.previousData = [];
            for (let v = 0; v < this.divsY; v++) {
                for (let h = 0; h < this.divsX; h++) {
                    if (!this.data[v]) {
                        this.previousData[v] = [];
                        this.data[v] = [];
                    }

                    this.previousData[v][h] = undefined;
                    this.data[v][h] = this.initVal(v, h, false, debug);
                }
            }

            debug && console.log(this.data.slice());
        }

        initWidget() {
            $('.square-size-x').val(this.sizeX);
            $('.square-size-y').val(this.sizeY);
            $('.square-divs-x').val(this.divsX);
            $('.square-divs-y').val(this.divsY);
            $('.square-offset-x').val(this.offsetX);
            $('.square-offset-y').val(this.offsetY);
            $('.square-feed-the-beast').prop('checked', !!this.initFeedTheBeast);
            $('.square-from-middle').prop('checked', !!this.fromMiddle);
            $('.square-middle-size').val(this.middleSize);
            $('.square-from-border').prop('checked', !!this.fromBorder);
            $('.square-border-size').val(this.borderSize);
            $('.square-white-noise').prop('checked', !!this.whiteNoise);
            $('.square-init-sign').val(this.initSign);
            $('.square-init-diagonals').val(this.initDiagonals);
            this.initWidgetMatrix();
            $('.square-sequence').val(this.sequenceStr);
            $('.square-sequence-length').text(this.sequence.length);
            $('.square-cw').prop('checked', !!this.cw);
            $('.square-start-phase').val(this.startPhase);
            $('.square-feed-phase').val(this.feedPhase);

            $('.square-play')
                .off('click')
                .click(() => {
                let $target = $(event.currentTarget);
                this.stopped || this.paused
                    ? this.play() & this.togglePlayStatus()
                    : this.pause() & this.togglePlayStatus();
            });

            $('.square-stop')
                .off('click')
                .click(() => {
                    this.stop();
                    this.togglePlayStatus();
                });

            this.initSequenceCanvas();
        }

        initSequenceCanvas() {
            let sequenceCanvas = $('#sequence-canvas').get(0);
            let sequenceCtxt = sequenceCanvas.getContext('2d');
            showSequence(this.sequence, sequenceCtxt);
        }

        initWidgetMatrix() {
            $('.square-matrix-0-0').text(this.initDiagonals * this.initSign);
            $('.square-matrix-0-1').text(this.initSign);
            $('.square-matrix-1-0').text(this.initSign);
            $('.square-matrix-1-1').text(this.initDiagonals * this.initSign);
        }

        updateFromWidget() {
            this.sizeX = 1*$('.square-size-x').val();
            this.sizeY = 1*$('.square-size-y').val();

            this.divsX = 1*$('.square-divs-x').val();
            this.divsY = 1*$('.square-divs-y').val();
            this.offsetX = 1*$('.square-offset-x').val();
            this.offsetY = 1*$('.square-offset-y').val();
            this.feedTheBeast = $('.square-feed-the-beast').prop('checked');
            this.initFeedTheBeast = this.feedTheBeast;
            this.fromMiddle = $('.square-from-middle').prop('checked');
            this.middleSize = 1*$('.square-middle-size').val();
            this.fromBorder = $('.square-from-border').prop('checked');
            this.borderSize = 1*$('.square-border-size').val();
            this.whiteNoise = $('.square-white-noise').prop('checked');
            this.initSign = 1*$('.square-init-sign').val();
            this.initDiagonals = 1*$('.square-init-diagonals').val();
            this.sequenceStr = $('.square-sequence').val();
            this.sequence = this.sequenceStr.split(' ');
            this.cw = $('.square-cw').prop('checked');
            this.startPhase = 1*$('.square-start-phase').val();
            this.feedPhase = 1*$('.square-feed-phase').val();

            this.initWidgetMatrix();
            this.initSequenceCanvas();
        }

        togglePlayStatus() {
            $('.square-play').text(this.stopped || this.paused ? 'play' : 'pause');
        }

        initVal(v, h, feedTheBeast, debug) {
            if (this.fromBorder) {
                if (v < this.borderSize || v >= this.divsY - this.borderSize
                    || h < this.borderSize || h >= this.divsX - this.borderSize
                ) {
                    return v %2 == h % 2 ? this.initSign * this.initDiagonals : this.initSign;
                }
            }

            if (this.fromMiddle) {
                let hm = Math.floor(this.middleSize/2);
                let y0 = Math.floor(this.divsY/2) - hm;
                let y1 = y0 + this.middleSize;
                let x0 = Math.floor(this.divsX/2) - hm;
                let x1 = x0 + this.middleSize;
                if (debug) console.log(v, h, '--', y0, y1, x0, x1);

                if (v >= y0 && v <= y1 && h >= x0 && h <= x1) {
                    return v %2 == h % 2 ? this.initSign * this.initDiagonals : this.initSign;
                }
            }

            if (this.whiteNoise) {
                return Math.random() * 2 - 1;
            }

            if (this.fromMiddle || this.fromBorder) {
                return 0;
            }

            return ((v % 2 == h % 2) ? this.initDiagonals : 1) * this.initSign;
        }

        valueToColor(val, channel, debug) {
            if (channel > 3) {
                return 0;
            }

            if (channel == 3) {
                return 1.0;
            }

            if (val < 0) {
                return this.valueToColor(-val, 2 - channel, debug);
            }

            if (val > Math.pow(2, 24)) {
                return this.valueToColor(val / Math.pow(2, 24), channel, debug);
            }

            var val0 = Math.round(val % 256);
            if (channel == 0) {
                return val0;
            }

            var val1 = Math.round((val - val0) / 256) % 256;
            if (channel == 1) {
                return val1;
            }

            var val2 = Math.round((val - val1 * 256 - val0) / (256 * 256)) % 256;
            if(debug) console.log(val, val0, val1, val2);

            return val2;
        }

        none() {
            return;
        }

        applyVector(vec, feedTheBeast, debug) {
            debug && console.log('applyVector', vec, feedTheBeast, debug);
            if (vec[0] == 0 && vec[1] == 0) {
                return;
            }

            for (
                let v = vec[1] > 0 ? 0 : this.divsY + (vec[1] == 0 ? -1 : vec[1]);
                vec[1] > 0 ? v < this.divsY - vec[1] : v + vec[1] > 0;
                v += vec[1] > 0 ? 1 : -1
            ) {
                for (
                    let h = vec[0] >= 0 ? 0 : this.divsX + vec[0];
                    vec[0] >= 0 ? h < this.divsX : h + vec[0] > 0;
                    h += vec[0] >= 0 ? 1 : -1
                ) {
                    //console.log(h, v, vec[0], vec[1]);
                    this.data[v][h] += this.data[v + vec[1]][h + vec[0]];
                }
            }

            if (feedTheBeast) {
                if (vec[0] != 0) {
                    for (
                        let h = vec[0] > 0 ? this.divsX - vec[0] : -vec[0];
                        vec[0] > 0 ? h < this.divsX : h >= 0;
                        h += vec[0] > 0 ? 1 : -1
                    ) {
                        for (let v = 0; v < this.divsY; v++) {
                            this.data[v][h] = this.initVal(v, h, this.recall(feedTheBeast, 0.5, debug), debug);
                        }
                    }
                }

                if (vec[1] != 0) {
                    for (
                        let v = vec[1] > 0 ? this.divsY - vec[1] : -vec[1];
                        vec[1] > 0 ? v < this.divsY : v >= 0;
                        v += vec[1] > 0 ? 1 : -1
                    ) {
                        for (let h = 0; h < this.divsX; h++) {
                            this.data[v][h] = this.initVal(v, h, this.recall(feedTheBeast, 0.5, debug), debug);
                        }
                    }
                }
            }
        }

        recall(val, p, debug) {
            var r = Math.random();
            debug && console.log('recall rand', r, p, val);
            return r <= p ? val : undefined;
        }

        cycle(nb, cw, debug) {
            for (let i = 0; i < nb * 4; i++) {
                this.cycleStep(i, cw, debug);
            }
        }

        randmul(vec, active) {
            active = active !== false;
            return [
                (active ? Math.round(Math.random() * (this.divsX - 1)/2) : 1) * vec[0],
                (active ? Math.round(Math.random() * (this.divsY - 1)/2) : 1) * vec[1]
            ];
        }

        cycleStep(i, cw, debug) {
            for (let v = 0; v < this.divsY; v++) {
                for (let h = 0; h < this.divsX; h++) {
                    this.previousData[v][h] = this.data[v][h];
                }
            }

            debug && console.log(this.sequence, i, this.sequence[i]);

            let feed = this.feedTheBeast;// && this.feedPhase == i;
            //this[this.sequence[i]](10, feed, debug);
            if (undefined !== arrowsVector[this.sequence[i]]) {
                this.applyVector(this.randmul(arrowsVector[this.sequence[i]], false), feed, debug);
            }
            //if (feed) this.feedTheBeast = false;

            this.show(debug);
        }

        show(debug) {
            let score = 0;
            for (let h = 0; h < this.divsX; h++) {
                let str = h + ' --> ';
                for (let v = 0; v < this.divsY; v++) {
                    str += '|' + ('' + this.data[v][h]).padStart(12, ' ');

                    let linearizedColor = this.getColor(
                        this.valueToColor(this.data[v][h], 0),
                        this.valueToColor(this.data[v][h], 1),
                        this.valueToColor(this.data[v][h], 2),
                        this.valueToColor(this.data[v][h], 3)
                    );

                    if (this.previousData[v][h] !== undefined) {
                        let linearizedPreviousColor = Math.round(this.previousData[v][h] * 255);

                        let delta = this.data[v][h] - this.previousData[v][h];
                        if (delta != 0) score++;

                        ctxt2.fillStyle = this.getColor(
                            delta < 0
                                ? (Math.abs(this.data[v][h]) < Math.abs(this.previousData[v][h])
                                    ? Math.abs(Math.round(255*this.data[v][h]/this.previousData[v][h]))
                                    : Math.abs(Math.round(255*this.previousData[v][h]/this.data[v][h]))
                                )
                                : 0,
                            delta > 0 ? Math.abs(Math.round(255*this.previousData[v][h]/this.data[v][h])) : 0,
                            0
                        );
                        ctxt2.fillRect(this.sideX * (h + this.offsetX), this.sideY * (v + this.offsetY), this.sideX, this.sideY);
                    }

                    ctxt.fillStyle = linearizedColor;
                    ctxt.fillRect(this.sideX * (h + this.offsetX), this.sideY * (v + this.offsetY), this.sideX, this.sideY);
                }

                debug && console.log(str + '|');
            }

            let dScore = this.score === undefined ? score : this.score - score;

            $('.square-score').text(dScore);

            this.score = score;
        }

        getColor(r, g, b, a) {
            return 'rgba('
                + r
                + ',' + g
                + ',' + b
                + ', ' + (a == undefined ? 1.0 : a)
                + ')';
        }

        animate(i, cw, debug) {
            if (this.stopped || this.paused) {
                this.animationArgs = [i, cw, debug];
                return;
            }

            this.currentPhase = i == undefined ? 0 : i;

            this.cycleStep(this.currentPhase, cw, debug);

            this.currentPhase += this.cw ? 1 : -1;
            if (this.currentPhase < 0) {
                this.currentPhase += this.sequence.length;
            } else if (this.currentPhase >= this.sequence.length) {
                this.currentPhase = this.currentPhase % this.sequence.length;
            }

            window.requestAnimationFrame(
                this.animate.bind(
                    this,
                    this.currentPhase,
                    cw,
                    debug
                )
            );
        }

        pause() {
            this.paused = true;
            this.stopped = false;
        }

        play() {
            if (this.stopped) {
                this.updateFromWidget();
                this.init();
            }
            this.paused = false;
            this.stopped = false;
            this.animate(...this.animationArgs);
        }

        stop() {
            this.paused = false;
            this.stopped = true;
        }

        setFeedTheBeast(feedTheBeast) {
            this.feedTheBeast = !!feedTheBeast;
        }
    }

    let fromMiddle = Math.round(Math.random());
    let fromBorder = Math.round(Math.random());
    let whiteNoise = !!Math.round(Math.random());
    let initSign = Math.round(Math.random()) ? 1 : -1;
    let initDiagonals = Math.round(Math.random() * 2 - 1);
    let cw = !!Math.round(Math.random());

    let sequence = [],
        arrows = ['downleft', 'up', 'left', 'upleft', 'down', 'right', 'downright', 'upright'],
        vectors = [[-1, -1], [0, 1], [-1, 0], [-1, 1], [0, -1], [1, 0], [1, -1], [1, 1]],
        arrowsVector = {
            'downleft': [-1, -1],
            'up': [0, 1],
            'left': [-1, 0],
            'upleft': [-1, 1],
            'down': [0, -1],
            'right': [1, 0],
            'downright': [1, -1],
            'upright': [1, 1]
        };

    let shuffle = (array) => {
        let counter = array.length;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            let index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            let temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }

        return array;
    }

    let showSequence = (sequence, ctxt) => {
        let width = 0, height = 0, lineLength = 30, arrowLength=Math.round(lineLength/5);
        let x = 0, y = 0, minX = 0, maxX = 0, minY = 0, maxY = 0;
        for (var i in sequence) {
            switch (sequence[i]) {
                case 'up':
                    y -= lineLength;
                    if (minY > y) minY = y;
                    if (maxY < y) maxY = y;
                    break;
                case 'down':
                    y += lineLength;
                    if (minY > y) minY = y;
                    if (maxY < y) maxY = y;
                    break;
                case 'left':
                    x -= lineLength;
                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    break;
                case 'right':
                    x += lineLength;
                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    break;
                case 'upleft':
                    x -= lineLength;
                    y -= lineLength;
                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    if (minY > y) minY = y;
                    if (maxY < y) maxY = y;
                    break;
                case 'downleft':
                    x -= lineLength;
                    y += lineLength;
                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    if (minY > y) minY = y;
                    if (maxY < y) maxY = y;
                    break;
                case 'upright':
                    x += lineLength;
                    y -= lineLength;
                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    break;
                case 'downright':
                    x += lineLength;
                    y += lineLength;
                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    if (minX > x) minX = x;
                    if (maxX < x) maxX = x;
                    break;
            }
        }

        ctxt.canvas.width = Math.abs(maxX - minX) + 2*lineLength;
        ctxt.canvas.height = Math.abs(maxY - minY) + 2*lineLength;

        ctxt.translate(
            - minX + lineLength,
            - minY + lineLength
        );

        x = 0, y = 0;
        ctxt.save();
        ctxt.fillStyle = 'green';
        ctxt.fillRect(Math.round(-lineLength/2), Math.round(-lineLength/2), lineLength, lineLength);
        ctxt.restore();

        for (var i in sequence) {
            switch (sequence[i]) {
                case 'up':
                    if (i == sequence.length - 1) {
                        ctxt.save();
                        ctxt.fillStyle = 'red';
                        ctxt.fillRect(
                            x + Math.round(-lineLength/2),
                            y - lineLength + Math.round(-lineLength/2),
                            lineLength,
                            lineLength
                        );
                        ctxt.restore();
                    }

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    y -= lineLength;
                    ctxt.lineTo(x, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x-arrowLength, y+arrowLength);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x+arrowLength, y+arrowLength);
                    ctxt.stroke();
                    break;
                case 'down':
                    if (i == sequence.length - 1) {
                        ctxt.save();
                        ctxt.fillStyle = 'red';
                        ctxt.fillRect(
                            x + Math.round(-lineLength/2),
                            y + lineLength + Math.round(-lineLength/2),
                            lineLength,
                            lineLength
                        );
                        ctxt.restore();
                    }
                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    y += lineLength;
                    ctxt.lineTo(x, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x-arrowLength, y-arrowLength);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x+arrowLength, y-arrowLength);
                    ctxt.stroke();
                    break;
                case 'left':
                    if (i == sequence.length - 1) {
                        ctxt.save();
                        ctxt.fillStyle = 'red';
                        ctxt.fillRect(
                            x - lineLength + Math.round(-lineLength/2),
                            y + Math.round(-lineLength/2),
                            lineLength,
                            lineLength
                        );
                        ctxt.restore();
                    }
                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    x -= lineLength;
                    ctxt.lineTo(x, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x+arrowLength, y-arrowLength);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x+arrowLength, y+arrowLength);
                    ctxt.stroke();
                    break;
                case 'right':
                    if (i == sequence.length - 1) {
                        ctxt.save();
                        ctxt.fillStyle = 'red';
                        ctxt.fillRect(
                            x + lineLength + Math.round(-lineLength/2),
                            y + Math.round(-lineLength/2),
                            lineLength,
                            lineLength
                        );
                        ctxt.restore();
                    }
                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    x += lineLength;
                    ctxt.lineTo(x, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x-arrowLength, y-arrowLength);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x-arrowLength, y+arrowLength);
                    ctxt.stroke();
                    break;
                case 'upleft':
                    if (i == sequence.length - 1) {
                        ctxt.save();
                        ctxt.fillStyle = 'red';
                        ctxt.fillRect(
                            x - lineLength + Math.round(-lineLength/2),
                            y - lineLength + Math.round(-lineLength/2),
                            lineLength,
                            lineLength
                        );
                        ctxt.restore();
                    }
                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    x -= lineLength;
                    y -= lineLength;
                    ctxt.lineTo(x, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x+arrowLength, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x, y+arrowLength);
                    ctxt.stroke();
                    break;
                case 'upright':
                    if (i == sequence.length - 1) {
                        ctxt.save();
                        ctxt.fillStyle = 'red';
                        ctxt.fillRect(
                            x + lineLength + Math.round(-lineLength/2),
                            y - lineLength + Math.round(-lineLength/2),
                            lineLength,
                            lineLength
                        );
                        ctxt.restore();
                    }
                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    x += lineLength;
                    y -= lineLength;
                    ctxt.lineTo(x, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x-arrowLength, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x, y+arrowLength);
                    ctxt.stroke();
                    break;
                case 'downleft':
                    if (i == sequence.length - 1) {
                        ctxt.save();
                        ctxt.fillStyle = 'red';
                        ctxt.fillRect(
                            x - lineLength + Math.round(-lineLength/2),
                            y + lineLength + Math.round(-lineLength/2),
                            lineLength,
                            lineLength
                        );
                        ctxt.restore();
                    }
                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    x -= lineLength;
                    y += lineLength;
                    ctxt.lineTo(x, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x+arrowLength, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x, y-arrowLength);
                    ctxt.stroke();
                    break;
                case 'downright':
                    if (i == sequence.length - 1) {
                        ctxt.save();
                        ctxt.fillStyle = 'red';
                        ctxt.fillRect(
                            x + lineLength + Math.round(-lineLength/2),
                            y + lineLength + Math.round(-lineLength/2),
                            lineLength,
                            lineLength
                        );
                        ctxt.restore();
                    }
                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    x += lineLength;
                    y += lineLength;
                    ctxt.lineTo(x, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x-arrowLength, y);
                    ctxt.stroke();

                    ctxt.beginPath();
                    ctxt.moveTo(x, y);
                    ctxt.lineTo(x, y-arrowLength);
                    ctxt.stroke();
                    break;
            }
        }
    }

    //arrows = shuffle(arrows);

    arrows = {
        'downleft': [-1, -1],
        'left': [-1, 0],
        'upleft': [-1, 1],
        'down': [0, -1],
        'none': [0, 0],
        'up': [0, 1],
        'downright': [1, -1],
        'right': [1, 0],
        'upright': [1, 1]
    };

    arrowNames = Object.keys(arrows);

    // let feedPhases = [];
    let idxSequence = [];
    var sumX = 0, sumY = 0;
    for (var i = 0; i <= Math.round(Math.random() * 1000) + 20; i++) {

        for (var j = 0; j <= Math.round(Math.random() * 10) + 1; j++) {
            var idx = Math.round(Math.random() * (arrowNames.length - 1));
            sequence.push(arrowNames[idx]);

            sumX += arrows[sequence[i+j]][0];
            sumY += arrows[sequence[i+j]][1];
        }
        // feedPhases.push(!!Math.round(Math.random()));

        //var moyX = sumX/sequence.length;
        //var moyY = sumY/sequence.length;

        var vec = [
            sumX == 0 ? 0 : (sumX > 0 ? -1 : 1),
            sumY == 0 ? 0 : (sumY > 0 ? -1 : 1)
        ];

        var k = (vec[0] + 1) * 3 + (vec[1] + 1);
        var arrowName = arrowNames[k];
        sumX += arrows[arrowName][0];
        sumY += arrows[arrowName][1];
        // console.log(moyX, moyY, vec, arrowName);

        sequence.push(arrowName);
    }

    let startPhase = Math.round(Math.random() * (sequence.length - 1));
    let feedPhase = 0; //Math.round(Math.random() * (sequence.length - 1));

    let maxWidth = Math.round(Math.random() * canvas.width),
        maxHeight = Math.round(Math.random() * canvas.height),
        middleSize = Math.round(Math.random() * Math.min(maxWidth, maxHeight)),
        borderSize = Math.round(Math.random() * Math.min(maxWidth, maxHeight));

    window.square = new Square(
        maxWidth,
        maxHeight,
        maxWidth,
        maxHeight,
        0,
        0,
        true,
        fromMiddle,
        middleSize,
        fromBorder,
        borderSize,
        whiteNoise,
        initSign,
        initDiagonals,
        sequence.join(' '),
        cw,
        startPhase,
        feedPhase
    );

    // square.split();
    square.animate(
        startPhase,
        cw,
        false
    );
});
