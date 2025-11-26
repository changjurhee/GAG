#pragma once

#include "BangGuChaWall.generated.h"
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"

class UBoxComponent;
class UStaticMeshComponent;

UCLASS()
class BANGGUCHA_API ABangGuChaWall : public AActor {
  GENERATED_BODY()

public:
  ABangGuChaWall();

protected:
  virtual void BeginPlay() override;

public:
  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UBoxComponent *CollisionComp;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UStaticMeshComponent *MeshComp;
};
