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
        container.logger.info('Loading: pump-controller-middleware.js')

    /* -----  HELPER FUNCTIONS -----*/

    //helper function to convert index (1, 2) to pump addres (96, 97)
    var pumpIndexToAddress = function(index) {
        index = parseInt(index)
        if (index === 1) {
            return 96

        } else if (index === 2) {
            return 97
        }
        return -1
    }

    //helper function to convert pump address (96, 97) to index (1, 2)
    var pumpAddressToIndex = function(address) {
        address = parseInt(address)
        if (address === 96) {
            return 1

        } else if (address === 97) {
            return 2
        }
        return -1
    }

    var validRPM = function(rpm) {
        if (rpm >= 450 && rpm <= 3450)
            return true
        else
            return false
    }

    var validProgram = function(program) {
        if (program >= 1 && program <= 4)
            return true
        else {
            return false
        }
    }
    /* ----- END HELPER FUNCTIONS -----*/


    /* ----- PUMP PACKET SEQUENCES -----*/

    //generic functions that ends the commands to the pump by setting control to local and requesting the status
    var endPumpCommandSequence = function(address) {
        //container.pumpController.setPumpToLocalControl(address)
        container.pumpController.requestPumpStatus(address)

    }

    //function to set the power on/off of the pump
    var runPowerSequence = function(index, power) {
        var address = pumpIndexToAddress(index)

        container.pumpController.setPumpToRemoteControl(address)
        container.pumpController.sendPumpPowerPacket(address, power)
        endPumpCommandSequence(address)

    }

    var requestStatusSequence = function(index) {
        var address = pumpIndexToAddress(index)
        container.pumpController.setPumpToRemoteControl(address)
        container.pumpController.requestPumpStatus(address)
    }

    // function pumpCommandRunSpeedProgram(index, program, rpm) {
    //     pumpCommandSaveProgramSpeed(index, program, rpm)
    //     //runProgramSequence(index, program))
    // }

    //function to run a program
    var runProgramSequence = function(index, program) {
        var address = pumpIndexToAddress(index)
        container.pumpController.setPumpToRemoteControl(address)
        container.pumpController.runProgram(address, program)
        //NOTE: In runRPM we send the power each time.  Do we not need to do that with Program sequence?
        if (container.pump.getPower(index) !== 1)
            container.pumpController.sendPumpPowerPacket(address, 1)

        endPumpCommandSequence(address)
        //return true


        // container.logger.warn('User request to run pump %s (address %s) Program %s for an unspecified duration', index, address, program);
        // return false
        //return runProgramSequenceForDuration(index, program)
    }

    //function to run a given RPM for an unspecified time

    var runRPMSequence = function(index, rpm) {
        var address = pumpIndexToAddress(index)
        container.pumpController.setPumpToRemoteControl(address)
        //when run from Intellitouch, the power on packet is always sent
        container.pumpController.sendPumpPowerPacket(address, 1)
        container.pumpController.runRPM(address, rpm)
        endPumpCommandSequence(address)

        //return runRPMSequenceForDuration(index, rpm, 1440)

    }

    //function to run a given RPM for a specified duration
    // function runProgramSequenceForDuration(index, program, duration) {
    //     var address = pumpIndexToAddress(index)
    //
    //     if (address > -1 && validProgram(program) && duration > 0 && duration !== null) {
    //
    //         if (container.settings.logApi) container.logger.verbose('Request to set pump %s (address: %s) to Program %s  for %s minutes', index, address, program, duration);
    //
    //         container.pumpController.setPumpToRemoteControl(address)
    //         container.pumpController.sendPumpPowerPacket(address, 1) //maybe this isn't needed???  Just to save we should not turn power on.
    //         container.pumpController.runProgram(address, program)
    //         container.pumpController.setPumpDuration(address, duration)
    //
    //         //run the timer update 30s 2x/minute
    //         container.pumpControllerTimers.startProgramTimer(index, duration)
    //
    //         endPumpCommandSequence(address)
    //         return true
    //     }
    //     container.logger.warn('FAIL: Request to set pump %s (address: %s) to Program %s for %s minutes', index, address, program, duration);
    //     return false
    // }

    //function to run a program for a specified duration
    // function runRPMSequenceForDuration(index, rpm, duration) {
    //     var address = pumpIndexToAddress(index)
    //
    //     if (address > -1 && validRPM(rpm) && duration !== null && duration > 0) {
    //
    //         if (container.settings.logApi) container.logger.verbose('Request to set pump %s (address: %s) to RPM %s  for %s minutes', index, address, rpm, duration);
    //
    //         container.pumpController.setPumpToRemoteControl(address)
    //         container.pumpController.sendPumpPowerPacket(address, 1) //maybe this isn't needed???  Just to save we should not turn power on.
    //         container.pumpController.runRPM(address, rpm)
    //         console.log('duration_: ', duration)
    //         //NOTE: We may not be able to run an RPM for duration without a Program...
    //         container.pumpController.setPumpDuration(address, duration)
    //
    //         //run the timer update 30s 2x/minute
    //         container.pumpControllerTimers.startTimer(index)
    //
    //         endPumpCommandSequence(address)
    //         return true
    //     }
    //     container.logger.warn('FAIL: Request to set pump %s (address: %s) @ %s RPM for %s minutes', index, address, rpm, duration);
    //     return false
    // }

    /* ----- END PUMP PACKET SEQUENCES -----*/


    /* -----API, SOCKET OR INTERNAL FUNCTION CALLS -----*/

    //function to save the program & speed
    var pumpCommandSaveProgramSpeed = function(index, program, rpm) {
        var address = pumpIndexToAddress(index)
        if (address > -1 && validProgram(program)) {
            //set program packet
            if (validRPM(rpm)) {
                if (container.settings.logApi) container.logger.verbose('User request to save pump %s (address %s) to Program %s as %s RPM', index, address, program, rpm);

                container.pumpController.setPumpToRemoteControl(address)
                container.pumpController.saveProgramOnPump(address, program, rpm)
                container.pump.saveProgram(index, program, rpm)
                endPumpCommandSequence(address)
                return true

            } else {
                if (container.settings.logApi) container.logger.warn('FAIL: RPM provided (%s) is outside of tolerances.', rpm)
                return false
            }
        }
        container.logger.warn('FAIL: User request to save pump %s (address %s) to Program %s as %s RPM', index, address, program, rpm);
        return false
    }

    //function to save and run a program with rpm for a duration
    function pumpCommandSaveAndRunProgramWithSpeedForDuration(index, program, rpm, duration) {
        var address = pumpIndexToAddress(index)
        if (address > -1) {
          if (container.settings.logApi) container.logger.verbose('Request to set pump %s (address: %s) to Program %s @ %s RPM for %s minutes', index, address, program, rpm, duration);
            pumpCommandSaveProgramSpeed(index, program, rpm)
            // runProgramSequenceForDuration(index, program, duration)
            container.pumpControllerTimers.startProgramTimer(index, program, duration)
            return true

        }
        container.logger.warn('FAIL: Request to set pump %s (address: %s) to Program %s for @ %s RPM for %s minutes', index, address, program, rpm, duration);
        return false
    }

    // Should be depricated
    var pumpCommand = function(index, program, rpm, duration) {
        index = parseInt(index)

        if (rpm !== null) {
            rpm = parseInt(rpm)
        }
        if (duration !== null) {
            duration = parseInt(duration)
        }

        if (program === 'off') {
            container.pumpControllerTimers.clearTimer(index)
        } else if (program === 'on') {
            //what does this do on various pumps?
            if (duration === null) {
                duration = -1
            }
            container.pumpControllerTimers.startPowerTimer(index, duration)
        } else

        {
            if (validProgram(program)) {
                if (validRPM(rpm)) {
                    if (duration > 0) {
                        pumpCommandSaveAndRunProgramWithSpeedForDuration(index, program, rpm, duration)
                        //if (container.settings.logApi) container.logger.verbose('User request to save and run  pump %s as program %s @ %s RPM for %s minutes', index, program, rpm, duration);

                    } else {
                        //##
                        pumpCommandSaveProgramSpeed(index, program, rpm)
                        //if (container.settings.logApi) container.logger.verbose('User request to save pump %s as program %s @ %s RPM', index, program, rpm);
                    }
                } else {
                    if (duration > 0) {
                        // runProgramSequenceForDuration(index, program, duration)
                        container.pumpControllerTimers.startProgramTimer(index, program, duration)
                        //if (container.settings.logApi) container.logger.verbose('User request to run pump %s as program %s for %s minutes', index, program, duration);
                    } else {
                        // runProgramSequence(index, program)
                        container.pumpControllerTimers.startProgramTimer(index, program, -1)
                        //if (container.settings.logApi) container.logger.verbose('User request to run pump %s as program %s for an unspecified duration (will set timer to 24 hours)', index, program);

                    }
                }
            }

            //Program not valid
            else {
                if (duration > 0) {
                    //With duration, run for duration
                    // runRPMSequenceForDuration(index, rpm, duration)
                    container.pumpControllerTimers.startRPMTimer(index, rpm, duration)
                    //if (container.settings.logApi) container.logger.verbose('User request to run pump %s @ %s RPM for %s minutes', index, rpm, duration);


                } else {
                    //without duration, set timer for 24 hours
                    // runRPMSequence(index, rpm)
                    container.pumpControllerTimers.startRPMTimer(index, rpm, -1)
                    //if (container.settings.logApi) container.logger.verbose('User request to run pump %s @ %s RPM for an unspecified duration (will set timer to 24 hours)', index, rpm);

                }
            }
        }

        // //program should be one of 'on', 'off' or 1,2,3,4
        // if (program == 'on' || program == 'off') {
        //     program = program
        // } else {
        //     program = parseInt(program)
        // }
        //
        // var address = pumpIndexToAddress(index);
        //
        //
        // container.pumpController.setPumpToRemoteControl(address)
        //
        // //set program packet
        // if (validRPM(rpm)) {
        //     if (container.settings.logApi) container.logger.warn('rpm provided (%s) is outside of tolerances.  Program being run with rpm that is stored in pump.', rpm)
        // } else
        // if (isNaN(rpm) || rpm == null) {
        //     if (container.settings.logApi) container.logger.warn('Skipping Set Program rpm because it was not included.')
        // } else {
        //     container.pumpController.saveProgramOnPump(address, program, rpm)
        // }
        //
        // if (validProgram(program)) {
        //     container.pumpController.runProgram(address, program)
        //     container.pumpController.setPumpDuration(address, duration)
        //     //run the timer update 30s 2x/minute
        //     container.pumpControllerTimers.startTimer(index)
        // } else {
        //     if (container.settings.logApi) container.logger.verbose('User request to set pump %s to %s @ %s RPM', index, program, rpm);
        //     //if (program === 'off' || program === 'on')
        //
        //     container.pumpController.sendPumpPowerPacket(address, program)
        // }
        //
        // container.pumpController.setPumpToLocalControl(address)
        // container.pumpController.requestPumpStatus(address)
        //if (container.settings.logApi) container.logger.info('pumpCommand: End of Sending Pump Packet \n \n')

        //container.io.emitToClients('pump')
    }

    /* -----API, SOCKET OR INTERNAL FUNCTION CALLS -----*/


    /*istanbul ignore next */
    if (container.logModuleLoading)
        container.logger.info('Loaded: pump-controller-middleware.js')

    return {
        runProgramSequence: runProgramSequence,
        pumpCommand: pumpCommand,
        pumpCommandSaveProgramSpeed: pumpCommandSaveProgramSpeed,
        pumpCommandSaveAndRunProgramWithSpeedForDuration: pumpCommandSaveAndRunProgramWithSpeedForDuration,
        runRPMSequence: runRPMSequence,
        runPowerSequence: runPowerSequence,
        requestStatusSequence: requestStatusSequence,

        //testing
        pumpAddressToIndex: pumpAddressToIndex,
        pumpIndexToAddress: pumpIndexToAddress
    }

}
