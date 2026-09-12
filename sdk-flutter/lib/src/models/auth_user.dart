/// AuthEasy User model
class AuthUser {
  final String id;
  final String email;
  final String name;
  final String? avatarUrl;
  final bool isVerified;

  const AuthUser({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
    required this.isVerified,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      isVerified: json['isVerified'] == true || json['isVerified'] == 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'avatarUrl': avatarUrl,
        'isVerified': isVerified,
      };

  @override
  String toString() => 'AuthUser(id: $id, email: $email, name: $name)';
}
