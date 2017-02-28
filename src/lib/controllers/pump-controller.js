/*  nodejs-poolController.  An application to control pool equipment.
 *  Copyright (C) 2016, 2017.  Russell Goldin, tagyoureit.  russ.goldin@gmail.com
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = function(container) {


    /*istanbul ignore next */
    if (container.logModuleLoading)
        container.logger.info('Loading: pump-controller.js')



    /* ----- COMMANDS SENT DIRECTLY TO THE PUMP -----*/

    //turn pump on/off
    function sendPumpPowerPacket(address, power) {
        var index = container.pumpControllerMiddleware.pumpAddressToIndex(address)
        var setPrg;
        //if (container.settings.logApi) container.logger.info('User request to set pump %s to %s', pump, power);
        if (power === 0) {
            setPrg = [6, 1, 4];
            //manually set power packet here since it would not be done elsewhere
            container.pump.setPower(index, 0)
        } else if (power === 1) // pump set to on
        {
            setPrg = [6, 1, 10];
            container.pump.setPower(index, 1)
        }
        var pumpPowerPacket = [165, 0, address, container.settings.appAddress];
        Array.prototype.push.apply(pumpPowerPacket, setPrg)
        if (container.settings.logApi) container.logger.verbose('Sending Turn pump %s to %s: %s', index, power, pumpPowerPacket);
        container.queuePacket.queuePacket(pumpPowerPacket);
    }


    //set pump to remote control
    function setPumpToRemoteControl(address) {
        var remoteControlPacket = [165, 0, address, container.settings.appAddress, 4, 1, 255];
        if (container.settings.logApi) container.logger.verbose('Sending Set pump to remote control: %s', remoteControlPacket)
        container.queuePacket.queuePacket(remoteControlPacket);
    }

    //set pump to local control
    function setPumpToLocalControl(address) {
        var localControlPacket = [165, 0, address, container.settings.appAddress, 4, 1, 0];
        if (container.settings.logPumpMessages) container.logger.verbose('Sending Set pump to local control: %s', localControlPacket)
        container.queuePacket.queuePacket(localControlPacket);
    }

    //NOTE: This pump timer doesn't do what we think it does... I think.
    /* istanbul ignore next */
    function setPumpDuration(address, duration) {
        var index = container.pumpControllerMiddleware.pumpAddressToIndex(address)
        var setTimerPacket = [165, 0, address, container.settings.appAddress, 1, 4, 3, 43, 0, 1];
        if (container.settings.logApi) container.logger.info('Sending Set a 30 second timer (safe mode enabled, timer will reset 2x/minute for a total of %s minutes): %s', duration, setTimerPacket);

        container.queuePacket.queuePacket(setTimerPacket);
    }

    //run program packet
    function runProgram(address, program) {
        var index = container.pumpControllerMiddleware.pumpAddressToIndex(address)
        //run program
        var runPrg = [1, 4, 3, 33, 0]
        runPrg.push(8 * program)

        var runProgramPacket = [165, 0, address, container.settings.appAddress];
        Array.prototype.push.apply(runProgramPacket, runPrg);
        if (container.settings.logApi) container.logger.verbose('Sending Run Program %s: %s', program, runProgramPacket)
        container.queuePacket.queuePacket(runProgramPacket);
    }

    //run RPM packet
    function runRPM(address, rpm) {
        var index = container.pumpControllerMiddleware.pumpAddressToIndex(address)
        //run program
        var runPrg = [1, 4, 2, 196]
        runPrg.push(Math.floor(rpm/256))
        runPrg.push(rpm%256)

        var runProgramPacket = [165, 0, address, container.settings.appAddress];
        Array.prototype.push.apply(runProgramPacket, runPrg);
        if (container.settings.logApi) container.logger.verbose('Sending run at RPM %s: %s', rpm, runProgramPacket)
        container.queuePacket.queuePacket(runProgramPacket);
    }

    function saveProgramOnPump(address, program, speed, setPrg) {
        var index = container.pumpControllerMiddleware.pumpAddressToIndex(address)

        //save program on pump
        //set speed
        var setPrg = [1, 4, 3]
        setPrg.push(38 + program);
        setPrg.push(Math.floor(speed / 256))
        setPrg.push(speed % 256);
        var setProgramPacket = [165, 0, address, container.settings.appAddress];
        Array.prototype.push.apply(setProgramPacket, setPrg);
        //logger.info(setProgramPacket, setPrg)
        if (container.settings.logApi) container.logger.verbose('Sending Set Program %s to %s RPM: %s', program, speed, setProgramPacket);
        container.queuePacket.queuePacket(setProgramPacket);

    }

    //request pump status
    function requestPumpStatus(address) {
        var statusPacket = [165, 0, address, container.settings.appAddress, 7, 0];
        if (container.settings.logApi) container.logger.verbose('Sending Request Pump Status: %s', statusPacket)
        container.queuePacket.queuePacket(statusPacket);
    }


    /* ----- COMMANDS SENT DIRECTLY TO THE PUMP END -----*/



    /*istanbul ignore next */
    if (container.logModuleLoading)
        container.logger.info('Loaded: pump-controller.js')

    return {
        sendPumpPowerPacket: sendPumpPowerPacket,
        setPumpToRemoteControl: setPumpToRemoteControl,
        setPumpToLocalControl: setPumpToLocalControl,
        runProgram: runProgram,
        saveProgramOnPump: saveProgramOnPump,
        requestPumpStatus: requestPumpStatus,
        setPumpDuration : setPumpDuration,
        runRPM: runRPM


    }

}
