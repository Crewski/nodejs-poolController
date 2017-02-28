describe('chlorinator packets: recieves packets from buffer and follows them to decoding', function() {


    describe('#Without an intellitouch controller', function() {
        context('via serialport or Socat and ending with Socket.io', function() {

            before(function() {

                bottle.container.settings.logChlorinator = 1
                bottle.container.settings.logPumpMessages = 1
                bottle.container.settings.intellitouch = 0
                bottle.container.logger.transports.console.level = 'silly';
                bottle.container.server.init()
                bottle.container.io.init()
            });

            beforeEach(function() {

                sandbox = sinon.sandbox.create()
                clock = sandbox.useFakeTimers()
                loggerInfoStub = sandbox.stub(bottle.container.logger, 'info')
                loggerWarnStub = sandbox.stub(bottle.container.logger, 'warn')
                loggerVerboseStub = sandbox.stub(bottle.container.logger, 'verbose')
                loggerDebugStub = sandbox.stub(bottle.container.logger, 'debug')
                loggerSillyStub = sandbox.stub(bottle.container.logger, 'silly')
                queuePacketStub = sandbox.stub(bottle.container.queuePacket, 'queuePacket')

                intellitouchStub = sandbox.stub(bottle.container.intellitouch, 'checkIfNeedControllerConfiguration').returns(false)

                // pumpCommandSpy = sandbox.spy(bottle.container.pumpControllerMiddleware, 'pumpCommand')
                // checksumSpy = sandbox.spy(bottle.container.decodeHelper, 'checksum')
                // isResponseSpy = sandbox.spy(bottle.container.decodeHelper.isResponse)
                // isResponsePumpSpy = sandbox.spy(bottle.container.decodeHelper.isResponsePump)
                // isResponseChlorinatorSpy = sandbox.spy(bottle.container.decodeHelper.isResponseChlorinator)
                // isResponseControllerSpy = sandbox.spy(bottle.container.decodeHelper.isResponseController)
                // writePacketStub = sandbox.stub(bottle.container.writePacket, 'ejectPacketAndReset')
                // controllerConfigNeededStub = sandbox.stub(bottle.container.intellitouch, 'checkIfNeedControllerConfiguration')
                // processControllerPacketStub = sandbox.stub(bottle.container.processController, 'processControllerPacket')
                // processPumpPacketStub = sandbox.stub(bottle.container.processPump, 'processPumpPacket')
                // processChlorinatorPacketStub = sandbox.stub(bottle.container.processChlorinator, 'processChlorinatorPacket')
                receiveBufferStub = sandbox.spy(bottle.container.receiveBuffer, 'getProcessingBuffer')
                socketIOSpy = sandbox.spy(bottle.container.io, 'emitToClients')
                iOAOAStub = sandbox.spy(bottle.container.receiveBuffer, 'iterateOverArrayOfArrays')
                // bottle.container.queuePacket.queuePacketsArrLength = 0
            })

            afterEach(function() {
                bottle.container.chlorinator.init()
                sandbox.restore()

            })

            after(function() {
                bottle.container.settings.logChlorinator = 0
                bottle.container.settings.logPumpMessages = 0
                bottle.container.logger.transports.console.level = 'info'
                bottle.container.server.close()
            })

            it('#decodes status messages received from Intellichlor', function(done) {

                // 17:18:54.775 DEBUG Msg# 128   Chlorinator status packet: 165,16,15,16,25,22,25,9,128,23,133,0,73,110,116,101,108,108,105,99,104,108,111,114,45,45,52,48,7,232
                // setChlorinatorStatusFromController: 23 9 25 133 Intellichlor--40 128
                // 17:18:54.775 INFO Msg# 128   Initial chlorinator settings discovered:  {"saltPPM":1150,"outputPoolPercent":9,"outputSpaPercent":12,"SuperChlorinate":0,"status":133,"name":"Intellichlor--40"}
                var chlorinatorPkt_chk = [255, 0, 255, 165, 16, 15, 16, 25, 22, 25, 9, 128, 23, 133, 0, 73, 110, 116, 101, 108, 108, 105, 99, 104, 108, 111, 114, 45, 45, 52, 48, 7, 232]

                bottle.container.chlorinator.getChlorinatorStatus().saltPPM.should.eq(-1)
                bottle.container.packetBuffer.push(new Buffer(chlorinatorPkt_chk))

                // console.log('queuePacketStub: ', queuePacketStub.args)
                bottle.container.chlorinator.getChlorinatorStatus().saltPPM.should.eq(1150)

                var client = global.ioclient.connect(global.socketURL, global.socketOptions)
                client.on('chlorinator', function(data) {
                    // console.log('chlorinator:', data)
                    data.saltPPM.should.eq(1150)
                    client.disconnect()
                    done()
                })



            })

            it('#decodes status messages received from Intellichlor, and does not request name on subsequent chlorinator packets', function(done) {

                // 17:18:54.775 DEBUG Msg# 128   Chlorinator status packet: 165,16,15,16,25,22,25,9,128,23,133,0,73,110,116,101,108,108,105,99,104,108,111,114,45,45,52,48,7,232
                // setChlorinatorStatusFromController: 23 9 25 133 Intellichlor--40 128
                // 17:18:54.775 INFO Msg# 128   Initial chlorinator settings discovered:  {"saltPPM":1150,"outputPoolPercent":9,"outputSpaPercent":12,"SuperChlorinate":0,"status":133,"name":"Intellichlor--40"}
                var chlorinatorPkt_chk = [255,0,255,16,2,0,3,0,73,110,116,101,108,108,105,99,104,108,111,114,45,45,52,48,188,16,3]

                bottle.container.chlorinator.getChlorinatorStatus().name.should.eq(-1)
                bottle.container.packetBuffer.push(new Buffer(chlorinatorPkt_chk))

                bottle.container.chlorinator.getChlorinatorStatus().name.should.eq(`Intellichlor--40`)

                var client = global.ioclient.connect(global.socketURL, global.socketOptions)
                client.on('chlorinator', function(data) {
                    // console.log('chlorinator:', data)
                    data.name.should.eq(`Intellichlor--40`)
                    client.disconnect()
                    done()
                })
            })


            it('#decodes status packet and requests name since we do not have it', function(done) {

                // 17:18:54.775 DEBUG Msg# 128   Chlorinator status packet: 165,16,15,16,25,22,25,9,128,23,133,0,73,110,116,101,108,108,105,99,104,108,111,114,45,45,52,48,7,232
                // setChlorinatorStatusFromController: 23 9 25 133 Intellichlor--40 128
                // 17:18:54.775 INFO Msg# 128   Initial chlorinator settings discovered:  {"saltPPM":1150,"outputPoolPercent":9,"outputSpaPercent":12,"SuperChlorinate":0,"status":133,"name":"Intellichlor--40"}
                var chlorinatorPkt_chk = [255,0,255,16,2,0,1,0,0,19,16,3]

                bottle.container.chlorinator.getChlorinatorStatus().name.should.eq(-1)
                bottle.container.packetBuffer.push(new Buffer(chlorinatorPkt_chk))

                // console.log('queuePacketStub: ', queuePacketStub.args)
                queuePacketStub.args[0][0].should.deep.eq([ 16, 2, 80, 20, 0 ])  //request name
                loggerVerboseStub.args[0][0].should.contain('I am here')

                var client = global.ioclient.connect(global.socketURL, global.socketOptions)
                client.on('chlorinator', function(data) {
                    // console.log('chlorinator:', data)
                    data.name.should.eq(-1)
                    client.disconnect()
                    done()
                })
            })


        })
    })
})
