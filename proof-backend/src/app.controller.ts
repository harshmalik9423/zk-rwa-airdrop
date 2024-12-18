import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GenerateZkProofDto } from './dto/app.dto';
import { poseidon } from './utils/Circomlib';
import { Circuit } from './utils/Circuit';

@Controller()
export class AppController {
  constructor() {}

  //This API is used to generate the zk proof for the equity airdrop
  @Post('api/v1/generateZkProof')
  async generateZkProof(@Body() generateZkProofDto: GenerateZkProofDto) {
  try {
    //Creating the input to generate the zk hash 
    const inputs = {
      address: BigInt(generateZkProofDto.address),
      stockQuantity: BigInt(generateZkProofDto.stockQuantity),
      stockQuantityThreshold: BigInt(process.env.STOCK_QUANTITY_THRESHOLD),
      stockBuyTimestamp: BigInt(Math.floor(new Date(generateZkProofDto.stockBuyTimestamp).getTime() / 1000)),
      currentTimestamp: BigInt(Math.floor(Date.now() / 1000)),
      holdingPeriodThreshold: BigInt(Number(process.env.HOLDING_PERIOD_THRESHOLD_DAYS) * 86400),
      hash: null
    }

      //Creating the hash
      const hash = await poseidon([
        inputs.address.toString(),
        inputs.stockQuantity.toString(),
        inputs.stockBuyTimestamp.toString(),
      ]);
      inputs.hash = hash;

      const EquityProof = new Circuit('EquityProof');
      console.log('Printing inputs : ', inputs);
      const { proofCalldata } = await EquityProof.generateProof(inputs);

      const publicInputs: string[] = [
        inputs.address.toString(),
        inputs.stockQuantityThreshold.toString(),
        inputs.currentTimestamp.toString(),
        inputs.holdingPeriodThreshold.toString(),
        hash.toString(),
      ];

      return {
        statusCode: HttpStatus.CREATED,
        data: { proof: proofCalldata, publicInputs: publicInputs },
        message: 'ZK proof generated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
