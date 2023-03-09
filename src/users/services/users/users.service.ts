import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
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

  getUser(username:string) {
    return this.userRepository.findOne({
      where: {username}
    });
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
      const newUser = this.userRepository.create(createUserDto);
      return this.userRepository.save(newUser);  
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
      where: {username}
    });
    const payload = { username: user.username, userId: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

}