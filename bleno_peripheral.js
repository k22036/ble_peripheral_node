var util = require('util');
var bleno = require('bleno');

const APPROACH_SERVICE_UUID = 'ABCABC30-8883-49A8-8BDB-42BC1A7107F4';
const APPROACH_CHARACTERISTIC_UUID = 'CHARA077-201F-44EB-82E8-10CC02AD8CE1';

let counter = 0;

var Characteristic = bleno.Characteristic;

var ApproachCharacteristic = function() {
    ApproachCharacteristic.super_.call(this, {
        uuid : APPROACH_CHARACTERISTIC_UUID,
        properties: ['read', 'notify'],
        value : null
    });

    this._value = 0;
    this._updateValueCallback = null;
};

util.inherits(ApproachCharacteristic, Characteristic);

ApproachCharacteristic.prototype.onReadRequest = function(offset, callback) {
    console.log(counter);
    callback(this.RESULT_SUCCESS, this._value);
}

ApproachCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log('ApproachCharacteristic - onSubscribe');

    this._updateValueCallback = updateValueCallback;
};

ApproachCharacteristic.prototype.onUnsubscribe = function(maxValueSize, updateValueCallback) {
    console.log('ApproachCharacteristic - onUnsubscribe');

    this._updateValueCallback = null;
};

var PrimaryService = bleno.PrimaryService;

bleno.on('stateChange', function(state) {
    console.log('on -> stateChange: ' + state);

    if (state === 'poweredOn') {
        bleno.startAdvertising('Approach', [APPROACH_SERVICE_UUID]);
    } else {
        bleno.stopAdvertising();
    }
});

var approachCharacteristic = new ApproachCharacteristic();

bleno.on('advertisingStart', function(error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

    if(!error) {
        bleno.setServices([
            new PrimaryService({
                uuid: APPROACH_SERVICE_UUID,
                characteristics: [
                    approachCharacteristic
                ]
            })
        ]);
    }
});

setInterval(()=>{
    counter++;
    approachCharacteristic._value = counter;
    if (approachCharacteristic._updateValueCallback) {
        console.log(`Sending notification with value : ${approachCharacteristic._value}`);

        const notificationBytes = Buffer.from(String(approachCharacteristic._value));
        approachCharacteristic._updateValueCallback(notificationBytes);
    }
}, 1000);

