import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../users/constants';
import { Tournament } from 'src/typeorm/tournament.entity';
import { TournamentController } from './controllers/tournament/tournament.controller';
import { TournamentService } from './services/tournament/tournament.service';
import { UsersService } from 'src/users/services/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tournament]), PassportModule, JwtModule.register({
    secret: jwtConstants.secret,
    signOptions: { expiresIn: '3600s' },
  })],
  controllers: [TournamentController],
  providers: [TournamentService, UsersService]
})
export class TournamentModule {}
