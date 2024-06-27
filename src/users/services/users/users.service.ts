import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tournament, User } from 'src/typeorm';
import { CreateUserDto } from 'src/users/dto/users.dtos';
import { Repository } from 'typeorm';
import { generate, verify } from 'password-hash'
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private jwtService: JwtService
  ) {}
  
  getUsers() {
    return this.userRepository.find()
  }

  async getUser(username:string) {
    let user: User = await this.userRepository.findOne({
      where: {username},
      select: ["email", "id", "tournaments", "username", "admin"],
      relations: {
        tournaments: true,
      },
    });
    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    // Check
    const username = createUserDto.username
    const user = await this.userRepository.findOne({
      where: {username}
    });
    if(!user){
      // Hash password
      const clear = createUserDto.password
      createUserDto.password = generate(createUserDto.password);
      const newUser = this.userRepository.create({
        username: createUserDto.username,
        password: createUserDto.password,
        email: createUserDto.email,
        tournaments: []
      });
      return this.login((await this.userRepository.save(newUser)).username);
    }
    throw new HttpException('User already exist', HttpStatus.CONFLICT)
    
  }

  // Auth management
  async validateUser(username: string, pass: string): Promise<any> {
    
    const user = await this.userRepository.findOne({
      where: {username}
    });

    if (user && verify(pass, user.password)) {
      const { password, ...result } = user;
      return result.username;
    }
    return null;
  }

  async login(user: any) {
    const username  = user
    user = await this.userRepository.findOne({
      where: {"username": username}
    });
    if(user === null || username == undefined) {
      throw new HttpException('Failed to login', HttpStatus.FORBIDDEN)
    } else {
      const payload = { username: user.username, userId: user.id };
    return {
      username: user.username,
      email: user.email,
      access_token: this.jwtService.sign(payload),
    };
    }
    
  }

  async addTournament(user: User, tournament: Tournament) {
    user.tournaments.push(tournament);
    this.userRepository.save(user);  
  }

}