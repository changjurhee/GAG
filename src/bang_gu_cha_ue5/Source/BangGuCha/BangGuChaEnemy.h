#pragma once

#include "BangGuChaEnemy.generated.h"
#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"

class UBoxComponent;
class UStaticMeshComponent;

UCLASS()
class BANGGUCHA_API ABangGuChaEnemy : public APawn {
  GENERATED_BODY()

public:
  ABangGuChaEnemy();

protected:
  virtual void BeginPlay() override;

public:
  virtual void Tick(float DeltaTime) override;
  virtual void NotifyActorBeginOverlap(AActor *OtherActor) override;

  // Components
  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UBoxComponent *CollisionComp;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UStaticMeshComponent *MeshComp;

  // Movement
  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
  float MoveSpeed;

  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
  float GridSize;

  // State
  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "State")
  bool bIsStunned;

  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "State")
  float StunDuration;

  UFUNCTION(BlueprintCallable, Category = "State")
  void Stun();

private:
  FVector TargetLocation;
  FVector CurrentDirection;
  float StunTimer;

  void UpdateMovement(float DeltaTime);
  void ChooseNewDirection();
  bool CanMoveTo(FVector NewLocation);
};
