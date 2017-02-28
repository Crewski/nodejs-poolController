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

//Intellichlor status
module.exports = function(container) {

    /*istanbul ignore next */
    if (container.logModuleLoading)
        container.logger.info('Loading: 25.js')

        function process(data, counter) {


                if (container.settings.logChlorinator)
                    container.logger.debug('Msg# %s   Chlorinator status packet: %s', counter, data)

                    //TODO: move this to constants
                    var chlorinatorStatusBytes = {
                      "outputSpaPercent": 6,
                      "outputPercent": 7,
                      "saltPPM": 9,
                      "status": 10

                    }


                var outputSpaPercent = data[chlorinatorStatusBytes.outputSpaPercent]
                var outputPercent = data[chlorinatorStatusBytes.outputPercent];
                var saltPPM = data[chlorinatorStatusBytes.saltPPM];
                var status = data[chlorinatorStatusBytes.status]

                var name = container.chlorinator.getChlorinatorNameByBytes(data.slice(12,28))
                container.chlorinator.setChlorinatorStatusFromController(saltPPM, outputPercent, outputSpaPercent, status, name, counter)



            return true
        }


        /*istanbul ignore next */
    if (container.logModuleLoading)
            container.logger.info('Loaded: 25.js')


    return {
        process: process
    }
}
